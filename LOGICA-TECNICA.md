# Lógica Técnica de Ghostline

Este documento describe la implementación técnica y los flujos de datos del sistema Ghostline, detallando cómo cada componente interactúa para cumplir con la lógica de negocio.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Mensajes WhatsApp](#flujo-de-mensajes-whatsapp)
3. [Procesamiento de Imágenes](#procesamiento-de-imágenes)
4. [Gestión de Estado Conversacional](#gestión-de-estado-conversacional)
5. [Sistema de Agendamiento](#sistema-de-agendamiento)
6. [Gestión de Pagos](#gestión-de-pagos)
7. [Búsqueda Semántica](#búsqueda-semántica)
8. [Protocolos de Crisis](#protocolos-de-crisis)
9. [Seguimiento Post-Sesión](#seguimiento-post-sesión)
10. [Motor de Búsqueda de Portafolio](#motor-de-búsqueda-de-portafolio)

---

## 🏗️ Arquitectura General

### Componentes del Sistema

```
┌─────────────────┐
│  WhatsApp API   │ ──── Webhook ───▶ ┌──────────────────┐
└─────────────────┘                   │   NestJS Backend │
                                      │   (Orchestrator) │
                                      └─────────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
            ┌───────────────┐          ┌──────────────┐           ┌─────────────┐
            │   Supabase    │          │  Google      │           │   AWS S3    │
            │  (PostgreSQL) │          │  Gemini AI   │           │  (Storage)  │
            └───────────────┘          └──────────────┘           └──────┬──────┘
                                                                          │
                                                                          ▼
                                                                  ┌──────────────┐
                                                                  │  AWS Lambda  │
                                                                  │  (Ghostline) │
                                                                  │  Go + OpenCV │
                                                                  └──────────────┘
```

### Flujo de Datos Principal

1. **Entrada:** WhatsApp webhook → NestJS
2. **Procesamiento:** NestJS → Gemini AI (análisis) + Supabase (estado)
3. **Acción:** NestJS → WhatsApp API (respuesta)
4. **Persistencia:** Supabase (conversaciones, clientes, citas)

---

## 💬 Flujo de Mensajes WhatsApp

### 1. Recepción de Webhook

**Endpoint:** `POST /whatsapp/webhook`

**Proceso:**
```typescript
// whatsapp.controller.ts
1. Validar firma de WhatsApp (HMAC SHA256)
2. Extraer datos del mensaje:
   - from: Número del cliente
   - message_id: ID único
   - type: 'text' | 'image' | 'audio' | 'document'
   - content: Contenido del mensaje
3. Verificar si es mensaje del artista o del cliente
4. Enrutar al servicio correspondiente
```

**Lógica de Detección:**
```typescript
// Determinar si es el artista
if (from === process.env.ARTIST_PHONE_NUMBER) {
  // Es el artista enviando un diseño o comando
  await this.handleArtistMessage(message);
} else {
  // Es un cliente
  await this.handleClientMessage(message);
}
```

### 2. Procesamiento del Contexto

**Recuperación del Estado:**
```sql
-- Obtener conversación activa
SELECT * FROM conversations 
WHERE client_phone = ? 
AND status = 'active' 
ORDER BY updated_at DESC 
LIMIT 1;

-- Obtener historial de mensajes (últimos 10)
SELECT * FROM messages 
WHERE conversation_id = ? 
ORDER BY created_at DESC 
LIMIT 10;
```

**Construcción del Contexto para Gemini:**
```typescript
// assistant.service.ts
const context = {
  artistProfile: await this.getArtistProfile(),
  conversationHistory: messages.map(m => ({
    role: m.from_artist ? 'assistant' : 'user',
    content: m.content
  })),
  clientData: {
    name: client.name,
    previousProjects: client.projects_count,
    totalSpent: client.total_spent,
    lastVisit: client.last_appointment_date
  },
  currentStage: conversation.stage // 'inquiry' | 'qualified' | 'deposited' | 'scheduled'
};
```

### 3. Generación de Respuesta con Gemini

**Prompt del Sistema:**
```typescript
const systemPrompt = `
Eres Ghostline, el asistente de ${artist.name}, un tatuador de élite especializado en ${artist.style}.

REGLAS DE NEGOCIO:
- Tarifa por sesión: $${artist.session_rate} USD
- Abono de reserva: $${artist.deposit_amount} USD
- Política: Depósitos NO reembolsables
- Tono: ${artist.communication_style}

METODOLOGÍA DE PROYECTOS:
${artist.project_methodology}

RESTRICCIONES:
${artist.restrictions.join('\n')}

ETAPA ACTUAL: ${conversation.stage}

Tu objetivo es:
${this.getObjectiveByStage(conversation.stage)}
`;

const response = await gemini.generateContent({
  contents: [...conversationHistory, { role: 'user', parts: [{ text: userMessage }] }],
  systemInstruction: systemPrompt,
  tools: this.getFunctionTools() // checkAvailability, generatePaymentLink, etc.
});
```

### 4. Envío de Respuesta

**Proceso:**
```typescript
// whatsapp.service.ts
async sendMessage(to: string, message: string) {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Guardar mensaje enviado en DB
  await this.saveMessage({
    conversation_id: conversationId,
    from_artist: true,
    content: message,
    whatsapp_message_id: response.data.messages[0].id,
    status: 'sent'
  });
}
```

---

## 🎨 Procesamiento de Imágenes

### Flujo Completo: Del WhatsApp al Stencil

#### 1. Detección de Imagen

**Webhook recibe:**
```json
{
  "type": "image",
  "image": {
    "id": "wamid.xxx",
    "mime_type": "image/jpeg",
    "sha256": "abc123..."
  }
}
```

**Proceso:**
```typescript
// whatsapp.service.ts
async handleImageMessage(message: WhatsAppImageMessage) {
  // 1. Descargar imagen de WhatsApp
  const imageUrl = await this.getMediaUrl(message.image.id);
  const imageBuffer = await this.downloadMedia(imageUrl);

  // 2. Determinar si es del artista o cliente
  if (this.isFromArtist(message.from)) {
    // Es un diseño del artista → Procesar con Ghostline Engine
    await this.processArtistDesign(imageBuffer, message.from);
  } else {
    // Es referencia del cliente → Guardar y analizar
    await this.processClientReference(imageBuffer, message.from);
  }
}
```

#### 2. Subida a S3

**Storage Service:**
```typescript
// designs/storage.service.ts
async uploadToS3(
  imageBuffer: Buffer,
  tattooerId: string,
  type: 'original' | 'stencil',
  metadata: DesignMetadata
): Promise<string> {
  const fileName = `${Date.now()}_${metadata.name}.jpg`;
  const s3Key = `${tattooerId}/${type}s/${fileName}`;

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Body: imageBuffer,
    ContentType: 'image/jpeg',
    Metadata: {
      artist_id: tattooerId,
      upload_source: 'whatsapp',
      original_message_id: metadata.messageId,
      timestamp: new Date().toISOString()
    }
  };

  await this.s3Client.upload(uploadParams).promise();

  // Generar URL pre-firmada (válida por 7 días)
  const signedUrl = await this.s3Client.getSignedUrlPromise('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Expires: 604800 // 7 días
  });

  return signedUrl;
}
```

#### 3. Invocación de Lambda (Ghostline Engine)

**Processing Service:**
```typescript
// designs/processing.service.ts
async triggerStencilGeneration(s3Key: string, designId: string): Promise<void> {
  const lambdaPayload = {
    s3_bucket: process.env.AWS_S3_BUCKET,
    s3_key: s3Key,
    output_key: s3Key.replace('/originals/', '/stencils/'),
    processing_options: {
      threshold: 'auto',
      canny_low: 50,
      canny_high: 150,
      blur_kernel: 5,
      invert: true
    },
    callback_url: `${process.env.API_URL}/designs/webhook/processing-complete`,
    design_id: designId
  };

  const lambdaClient = new AWS.Lambda({
    region: process.env.AWS_REGION
  });

  await lambdaClient.invoke({
    FunctionName: process.env.GHOSTLINE_LAMBDA_NAME,
    InvocationType: 'Event', // Asíncrono
    Payload: JSON.stringify(lambdaPayload)
  }).promise();

  // Actualizar estado en DB
  await this.updateDesignStatus(designId, 'processing');
}
```

#### 4. Procesamiento en Lambda (Go)

**Pseudocódigo del Lambda:**
```go
// Lambda en Go + OpenCV
func ProcessImage(event LambdaEvent) error {
    // 1. Descargar de S3
    originalImage := downloadFromS3(event.S3Bucket, event.S3Key)
    
    // 2. Convertir a escala de grises
    grayImage := cv.CvtColor(originalImage, cv.COLOR_BGR2GRAY)
    
    // 3. Aplicar blur gaussiano
    blurred := cv.GaussianBlur(grayImage, image.Point{X: 5, Y: 5}, 0)
    
    // 4. Detección de bordes con Canny
    edges := cv.Canny(blurred, 50, 150)
    
    // 5. Invertir colores (fondo blanco, líneas negras)
    stencil := cv.BitwiseNot(edges)
    
    // 6. Subir stencil a S3
    uploadToS3(event.S3Bucket, event.OutputKey, stencil)
    
    // 7. Notificar al backend
    notifyBackend(event.CallbackURL, event.DesignID, event.OutputKey)
    
    return nil
}
```

#### 5. Callback de Procesamiento Completo

**Endpoint:** `POST /designs/webhook/processing-complete`

```typescript
// designs.controller.ts
async handleProcessingComplete(@Body() payload: ProcessingCompleteDto) {
  const design = await this.designsService.findById(payload.design_id);
  
  // 1. Actualizar estado
  design.status = 'processed';
  design.stencil_s3_key = payload.output_key;
  design.stencil_url = await this.storageService.getSignedUrl(payload.output_key);
  await design.save();

  // 2. Analizar con Gemini Vision para tags
  const tags = await this.analyzeImageWithGemini(design.stencil_url);
  design.tags = tags;
  await design.save();

  // 3. Notificar al artista vía WhatsApp
  await this.whatsappService.sendMessage(
    design.artist.phone_number,
    `✅ Diseño procesado. Lo he guardado en tu Dashboard bajo ${tags.join(' ')}. ¿Quieres que se lo envíe a tu cliente?`
  );
}
```

#### 6. Análisis con Gemini Vision

**Assistant Service:**
```typescript
// assistant.service.ts
async analyzeImageWithGemini(imageUrl: string): Promise<string[]> {
  const response = await this.gemini.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { 
          inlineData: {
            mimeType: 'image/jpeg',
            data: await this.fetchImageAsBase64(imageUrl)
          }
        },
        { 
          text: `Analiza este diseño de tatuaje y genera tags descriptivos en español. 
                 Incluye: estilo, elemento principal, zona sugerida, colores.
                 Formato: #Tag1 #Tag2 #Tag3`
        }
      ]
    }]
  });

  const tagsText = response.text();
  return tagsText.match(/#\w+/g) || [];
}
```

---

## 🧠 Gestión de Estado Conversacional

### Modelo de Base de Datos

**Tabla: conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  client_phone VARCHAR(20) NOT NULL,
  artist_id UUID REFERENCES artists(id),
  stage VARCHAR(20) NOT NULL, -- 'inquiry' | 'qualified' | 'deposited' | 'scheduled' | 'completed'
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'paused' | 'closed'
  project_details JSONB, -- { idea, zone, size, style, estimated_sessions }
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_client ON conversations(client_phone);
CREATE INDEX idx_conversations_stage ON conversations(stage);
```

**Tabla: messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  from_artist BOOLEAN NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20), -- 'text' | 'image' | 'payment_link' | 'appointment_confirmation'
  whatsapp_message_id VARCHAR(255),
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent' | 'delivered' | 'read' | 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

### Transición de Estados

**Diagrama de Estados:**
```
inquiry → qualified → deposited → scheduled → in_progress → completed
   ↓         ↓           ↓            ↓
abandoned  lost      cancelled    no_show
```

**Lógica de Transición:**
```typescript
// assistant.service.ts
async updateConversationStage(
  conversationId: string, 
  newStage: ConversationStage,
  metadata?: any
) {
  const conversation = await this.conversationsRepo.findById(conversationId);
  
  // Validar transición permitida
  const validTransitions = {
    'inquiry': ['qualified', 'abandoned'],
    'qualified': ['deposited', 'lost'],
    'deposited': ['scheduled', 'cancelled'],
    'scheduled': ['in_progress', 'no_show'],
    'in_progress': ['completed']
  };

  if (!validTransitions[conversation.stage].includes(newStage)) {
    throw new Error(`Transición inválida: ${conversation.stage} → ${newStage}`);
  }

  // Actualizar
  conversation.stage = newStage;
  conversation.stage_changed_at = new Date();
  
  if (metadata) {
    conversation.project_details = { ...conversation.project_details, ...metadata };
  }

  await conversation.save();

  // Triggers automáticos
  await this.handleStageChange(conversation, newStage);
}

async handleStageChange(conversation: Conversation, newStage: string) {
  switch (newStage) {
    case 'deposited':
      // Crear evento en Google Calendar (pendiente de fecha)
      await this.calendarService.createPendingAppointment(conversation);
      break;
    
    case 'scheduled':
      // Confirmar evento en Calendar
      await this.calendarService.confirmAppointment(conversation);
      // Programar recordatorio 24h antes
      await this.scheduleReminder(conversation);
      break;
    
    case 'cancelled':
      // Activar Gap Filler
      await this.gapFillerService.findReplacement(conversation);
      break;
  }
}
```

---

## 📅 Sistema de Agendamiento

### Integración con Google Calendar

**Calendar Service:**
```typescript
// calendar/calendar.service.ts
async createAppointment(data: AppointmentCreateDto): Promise<CalendarEvent> {
  const event = {
    summary: `Sesión ${data.session_number} - ${data.client_name}`,
    description: `
      Proyecto: ${data.project_type}
      Cliente: ${data.client_name}
      Teléfono: ${data.client_phone}
      Depósito: $${data.deposit_amount} USD
      Notas: ${data.notes}
    `,
    start: {
      dateTime: data.start_time.toISOString(),
      timeZone: 'America/Mexico_City'
    },
    end: {
      dateTime: data.end_time.toISOString(),
      timeZone: 'America/Mexico_City'
    },
    attendees: [
      { email: data.client_email }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 24 horas antes
        { method: 'popup', minutes: 60 }       // 1 hora antes
      ]
    },
    colorId: '10', // Verde para confirmadas
    extendedProperties: {
      private: {
        conversation_id: data.conversation_id,
        deposit_paid: 'true',
        session_number: data.session_number.toString()
      }
    }
  };

  const response = await this.calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
    sendUpdates: 'all'
  });

  // Guardar en DB local
  await this.appointmentRepo.create({
    conversation_id: data.conversation_id,
    google_event_id: response.data.id,
    start_time: data.start_time,
    end_time: data.end_time,
    status: 'confirmed'
  });

  return response.data;
}
```

### Recordatorio Automático (24h antes)

**Cron Job:**
```typescript
// calendar/appointment.scheduler.ts
@Cron('0 */30 * * * *') // Cada 30 minutos
async checkUpcomingAppointments() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Buscar citas en las próximas 24h que no han sido recordadas
  const appointments = await this.appointmentRepo.find({
    start_time: Between(now, in24Hours),
    reminder_sent: false,
    status: 'confirmed'
  });

  for (const apt of appointments) {
    await this.sendReminder(apt);
  }
}

async sendReminder(appointment: Appointment) {
  const conversation = await this.conversationsRepo.findById(
    appointment.conversation_id
  );

  const message = `
🔔 Recordatorio importante

Mañana a las ${format(appointment.start_time, 'HH:mm')} es tu sesión con ${conversation.artist.name}.

Recomendaciones para una mejor experiencia:
✅ Desayuna bien antes de venir
✅ Mantente hidratado
✅ Descansa bien la noche anterior
✅ Usa ropa cómoda y accesible para la zona a tatuar

¿Confirmas tu asistencia?
  `.trim();

  await this.whatsappService.sendMessage(
    conversation.client_phone,
    message
  );

  appointment.reminder_sent = true;
  appointment.reminder_sent_at = new Date();
  await appointment.save();
}
```

---

## 💳 Gestión de Pagos

### Generación de Link de Pago

**Payment Service:**
```typescript
// payments/payment.service.ts
async generateDepositLink(
  conversationId: string,
  amount: number,
  description: string
): Promise<PaymentLink> {
  // Ejemplo con Stripe
  const session = await this.stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Abono de Reserva',
          description: description,
          images: [artist.portfolio_image]
        },
        unit_amount: amount * 100 // Stripe usa centavos
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`,
    metadata: {
      conversation_id: conversationId,
      type: 'deposit'
    }
  });

  // Guardar en DB
  await this.paymentRepo.create({
    conversation_id: conversationId,
    stripe_session_id: session.id,
    amount: amount,
    currency: 'USD',
    status: 'pending',
    payment_url: session.url
  });

  return {
    url: session.url,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  };
}
```

### Webhook de Confirmación de Pago

**Endpoint:** `POST /payments/webhook/stripe`

```typescript
// payments.controller.ts
async handleStripeWebhook(@Body() payload: any, @Headers('stripe-signature') signature: string) {
  const event = this.stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const conversationId = session.metadata.conversation_id;

    // 1. Actualizar pago en DB
    await this.paymentRepo.update(
      { stripe_session_id: session.id },
      { status: 'completed', paid_at: new Date() }
    );

    // 2. Actualizar conversación a 'deposited'
    await this.conversationsService.updateStage(conversationId, 'deposited');

    // 3. Notificar al cliente
    const conversation = await this.conversationsRepo.findById(conversationId);
    await this.whatsappService.sendMessage(
      conversation.client_phone,
      `✅ ¡Depósito confirmado! Ya tienes tu lugar asegurado. Ahora coordinemos las fechas de tu primer viaje. ¿Qué fechas te vienen bien en las próximas semanas?`
    );

    // 4. Notificar al artista
    await this.whatsappService.sendMessage(
      conversation.artist.phone_number,
      `💰 Nuevo depósito confirmado de ${conversation.client_name} ($${session.amount_total / 100} USD). Proyecto: ${conversation.project_details.type}`
    );
  }
}
```

---

## 🔍 Búsqueda Semántica

### Almacenamiento de Embeddings

**Design Service:**
```typescript
// designs.service.ts
async storeDesignWithEmbedding(design: Design, tags: string[]) {
  // 1. Generar texto descriptivo
  const description = `${tags.join(' ')} ${design.notes || ''}`;

  // 2. Generar embedding con Gemini
  const embedding = await this.gemini.embedContent({
    model: 'embedding-001',
    content: description
  });

  // 3. Guardar en Supabase (con pgvector)
  await this.supabase.from('designs').insert({
    id: design.id,
    artist_id: design.artist_id,
    original_url: design.original_url,
    stencil_url: design.stencil_url,
    tags: tags,
    description: description,
    embedding: embedding.values, // Array de floats
    created_at: new Date()
  });
}
```

### Búsqueda Semántica

**Query en Lenguaje Natural:**
```typescript
// designs.service.ts
async searchDesigns(artistId: string, query: string, limit: number = 10) {
  // 1. Generar embedding de la query
  const queryEmbedding = await this.gemini.embedContent({
    model: 'embedding-001',
    content: query
  });

  // 2. Búsqueda por similitud coseno (pgvector)
  const { data } = await this.supabase.rpc('search_designs', {
    artist_id: artistId,
    query_embedding: queryEmbedding.values,
    match_threshold: 0.7,
    match_count: limit
  });

  return data;
}
```

**Función SQL (Supabase):**
```sql
CREATE OR REPLACE FUNCTION search_designs(
  artist_id UUID,
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  original_url TEXT,
  stencil_url TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.original_url,
    d.stencil_url,
    d.tags,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM designs d
  WHERE d.artist_id = artist_id
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 🚨 Protocolos de Crisis

### Gap Filler (Rescate de Cancelaciones)

**Gap Filler Service:**
```typescript
// calendar/gap-filler.service.ts
async handleCancellation(appointment: Appointment) {
  // 1. Buscar clientes compatibles
  const candidates = await this.findCompatibleClients({
    artist_id: appointment.artist_id,
    project_type: appointment.conversation.project_details.style,
    stage: ['qualified', 'deposited'],
    min_sessions: this.getSessionsNeeded(appointment)
  });

  // 2. Ordenar por prioridad
  const prioritized = this.prioritizeCandidates(candidates, {
    hasDeposit: 10,      // Ya pagaron = máxima prioridad
    responseTime: 5,     // Responden rápido
    projectSize: 3,      // Proyectos grandes
    waitTime: 2          // Tiempo en lista de espera
  });

  // 3. Notificar a los primeros 3
  const topCandidates = prioritized.slice(0, 3);
  
  for (const candidate of topCandidates) {
    await this.whatsappService.sendMessage(
      candidate.client_phone,
      `🔥 ¡Oportunidad exclusiva!

Se acaba de liberar un bloque de ${this.getSessionDays(appointment)} días continuos con ${appointment.artist.name} para ${format(appointment.start_time, 'dd/MM/yyyy')}.

Este es el momento perfecto para comenzar ese proyecto de ${candidate.project_details.type} que platicamos.

Como es un espacio de último minuto, ${appointment.artist.name} te da prioridad para saltarte los ${this.getWaitTimeMonths(candidate)} meses de espera.

⏰ El primero en confirmar se queda el espacio. ¿Lo tomamos?`
    );

    // Marcar como notificado
    await this.gapFillerRepo.create({
      original_appointment_id: appointment.id,
      candidate_conversation_id: candidate.id,
      notified_at: new Date(),
      status: 'pending'
    });
  }

  // 4. Configurar timeout de 2 horas
  setTimeout(async () => {
    await this.checkGapFillerResponses(appointment.id);
  }, 2 * 60 * 60 * 1000);
}

async findCompatibleClients(criteria: any) {
  return await this.conversationsRepo
    .createQueryBuilder('c')
    .where('c.artist_id = :artistId', { artistId: criteria.artist_id })
    .andWhere('c.stage IN (:...stages)', { stages: criteria.stage })
    .andWhere("c.project_details->>'style' = :style", { style: criteria.project_type })
    .orderBy('c.created_at', 'ASC')
    .getMany();
}
```

### Emergencia del Artista

**Artist Emergency Service:**
```typescript
// calendar/emergency.service.ts
async handleArtistEmergency(artistId: string, date: Date, reason: string) {
  // 1. Obtener todas las citas del día
  const affectedAppointments = await this.appointmentRepo.find({
    artist_id: artistId,
    start_time: Between(
      startOfDay(date),
      endOfDay(date)
    ),
    status: 'confirmed'
  });

  // 2. Obtener próximos huecos disponibles
  const availableSlots = await this.getNextAvailableSlots(artistId, 5);

  // 3. Notificar a cada cliente con opciones premium
  for (const apt of affectedAppointments) {
    const conversation = await this.conversationsRepo.findById(apt.conversation_id);
    
    const message = `
${conversation.client_name}, mil disculpas.

${artistId} tuvo una emergencia y necesitamos reprogramar tu sesión del ${format(apt.start_time, 'dd/MM/yyyy')}.

Tu depósito está 100% protegido y para compensarte, te doy acceso prioritario a estos espacios exclusivos de su agenda privada:

${availableSlots.map((slot, i) => 
  `${i + 1}. ${format(slot.date, 'dd/MM/yyyy')} - ${slot.description}`
).join('\n')}

¿Cuál prefieres? El primero que elijas queda bloqueado para ti.
    `.trim();

    await this.whatsappService.sendMessage(conversation.client_phone, message);

    // Actualizar estado
    apt.status = 'rescheduling';
    apt.reschedule_reason = reason;
    await apt.save();
  }

  // 4. Actualizar Google Calendar
  for (const apt of affectedAppointments) {
    await this.calendar.events.patch({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: apt.google_event_id,
      resource: {
        colorId: '11', // Rojo para emergencia
        summary: `[REPROGRAMAR] ${apt.summary}`,
        description: apt.description + `\n\nEmergencia: ${reason}`
      }
    });
  }
}
```

---

## 🩹 Seguimiento Post-Sesión

### Protocolo de Cicatrización (3 Semanas)

**Objetivo:** Monitorear la cicatrización del tatuaje y mantener engagement con el cliente.

#### Modelo de Base de Datos

**Tabla: healing_checkpoints**
```sql
CREATE TABLE healing_checkpoints (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES appointments(id),
  conversation_id UUID REFERENCES conversations(id),
  checkpoint_number INT NOT NULL, -- 1, 2, 3
  scheduled_date DATE NOT NULL,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  photo_received BOOLEAN DEFAULT false,
  photo_url TEXT,
  photo_received_at TIMESTAMP,
  artist_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'completed' | 'skipped'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_healing_checkpoints_session ON healing_checkpoints(session_id);
CREATE INDEX idx_healing_checkpoints_scheduled ON healing_checkpoints(scheduled_date);
```

#### Creación Automática de Checkpoints

**Trigger al Completar Sesión:**
```typescript
// calendar/appointment.service.ts
async completeSession(appointmentId: string) {
  const appointment = await this.appointmentRepo.findById(appointmentId);
  
  // 1. Actualizar estado de la cita
  appointment.status = 'completed';
  appointment.completed_at = new Date();
  await appointment.save();

  // 2. Crear checkpoints de cicatrización
  await this.createHealingCheckpoints(appointment);

  // 3. Enviar mensaje inicial de cuidados
  await this.sendPostSessionCareInstructions(appointment);
}

async createHealingCheckpoints(appointment: Appointment) {
  const checkpoints = [
    { number: 1, daysAfter: 7 },   // Semana 1
    { number: 2, daysAfter: 14 },  // Semana 2
    { number: 3, daysAfter: 21 }   // Semana 3
  ];

  for (const checkpoint of checkpoints) {
    const scheduledDate = addDays(appointment.completed_at, checkpoint.daysAfter);
    
    await this.healingCheckpointRepo.create({
      session_id: appointment.id,
      conversation_id: appointment.conversation_id,
      checkpoint_number: checkpoint.number,
      scheduled_date: scheduledDate,
      status: 'pending'
    });
  }

  console.log(`Created ${checkpoints.length} healing checkpoints for session ${appointment.id}`);
}
```

#### Cron Job de Recordatorios

**Scheduler Service:**
```typescript
// healing/healing-scheduler.service.ts
@Cron('0 10 * * *') // Diario a las 10:00 AM
async checkHealingReminders() {
  const today = startOfDay(new Date());

  // Buscar checkpoints programados para hoy que no han sido recordados
  const pendingCheckpoints = await this.healingCheckpointRepo.find({
    scheduled_date: today,
    reminder_sent: false,
    status: 'pending'
  });

  for (const checkpoint of pendingCheckpoints) {
    await this.sendHealingReminder(checkpoint);
  }
}

async sendHealingReminder(checkpoint: HealingCheckpoint) {
  const conversation = await this.conversationsRepo.findById(checkpoint.conversation_id);
  const session = await this.appointmentRepo.findById(checkpoint.session_id);

  const messages = {
    1: `¡Hola ${conversation.client_name}! Ya pasó una semana desde tu sesión con ${session.artist.name}. ¿Cómo va tu tatuaje? 🎨

Para asegurarme de que todo esté cicatrizando perfectamente, ¿podrías enviarme una foto de la zona tatuada? Esto me ayuda a:

✅ Verificar que la cicatrización va bien
✅ Ajustar recomendaciones de cuidado si es necesario
✅ Documentar tu proceso para el siguiente viaje

Recuerda seguir aplicando la crema recomendada 2-3 veces al día.`,

    2: `Segunda semana completada 🎉 ¿Cómo sientes tu tatuaje? ¿Ya no hay molestias?

Envíame otra foto para ver cómo va evolucionando. A esta altura ya debería estar bien sellado y los colores asentándose.`,

    3: `¡Última revisión! 🏁 Ya han pasado 3 semanas desde tu sesión.

Envíame la foto final para confirmar que todo está 100% curado. Después de esto, tu piel estará lista para el siguiente viaje${this.getNextTripInfo(conversation)}.`
  };

  await this.whatsappService.sendMessage(
    conversation.client_phone,
    messages[checkpoint.checkpoint_number]
  );

  // Marcar como enviado
  checkpoint.reminder_sent = true;
  checkpoint.reminder_sent_at = new Date();
  await checkpoint.save();
}

getNextTripInfo(conversation: Conversation): string {
  if (conversation.project_details?.next_trip_date) {
    return ` en ${format(conversation.project_details.next_trip_date, 'dd/MM/yyyy')}`;
  }
  return '';
}
```

#### Procesamiento de Fotos de Cicatrización

**WhatsApp Handler:**
```typescript
// whatsapp/whatsapp.service.ts
async handleClientImage(message: WhatsAppImageMessage, conversation: Conversation) {
  // Verificar si hay un checkpoint pendiente
  const pendingCheckpoint = await this.healingCheckpointRepo.findOne({
    conversation_id: conversation.id,
    reminder_sent: true,
    photo_received: false,
    status: 'pending'
  });

  if (pendingCheckpoint) {
    // Es una foto de seguimiento de cicatrización
    await this.processHealingPhoto(message, pendingCheckpoint);
  } else {
    // Es una referencia normal del cliente
    await this.processClientReference(message, conversation);
  }
}

async processHealingPhoto(message: WhatsAppImageMessage, checkpoint: HealingCheckpoint) {
  // 1. Descargar y subir a S3
  const imageUrl = await this.getMediaUrl(message.image.id);
  const imageBuffer = await this.downloadMedia(imageUrl);
  
  const s3Url = await this.storageService.uploadToS3(
    imageBuffer,
    checkpoint.session.artist_id,
    'healing',
    {
      name: `healing_week${checkpoint.checkpoint_number}_${checkpoint.session_id}`,
      messageId: message.id,
      checkpointId: checkpoint.id
    }
  );

  // 2. Actualizar checkpoint
  checkpoint.photo_received = true;
  checkpoint.photo_received_at = new Date();
  checkpoint.photo_url = s3Url;
  checkpoint.status = 'completed';
  await checkpoint.save();

  // 3. Analizar con Gemini Vision
  const analysis = await this.analyzeHealingWithGemini(s3Url, checkpoint.checkpoint_number);

  // 4. Si es el checkpoint final (día 21), agregar al portafolio
  if (checkpoint.checkpoint_number === 3) {
    await this.addToPortfolio(checkpoint, s3Url);
  }

  // 5. Responder al cliente
  const responses = {
    1: '¡Se ve excelente! La cicatrización está perfecta. Sigue con el mismo cuidado. Te escribo en una semana para el segundo check-in. 💪',
    2: '¡Impecable! Carlos va a estar muy contento con cómo está sanando. Ya puedes empezar a hidratarlo solo 1 vez al día. Una semana más y hacemos el último check-in.',
    3: this.getFinalCheckpointMessage(checkpoint, analysis)
  };

  await this.whatsappService.sendMessage(
    checkpoint.conversation.client_phone,
    responses[checkpoint.checkpoint_number]
  );

  // 6. Notificar al artista
  await this.notifyArtistHealingUpdate(checkpoint, analysis);
}

getFinalCheckpointMessage(checkpoint: HealingCheckpoint, analysis: any): string {
  const conversation = checkpoint.conversation;
  
  let message = `¡Perfecto! Cicatrización completada exitosamente. He guardado estas fotos en tu expediente.`;

  // Si hay próxima sesión programada
  if (conversation.project_details?.next_trip_date) {
    message += ` Carlos está listo para continuar con el Viaje ${checkpoint.session.trip_number + 1}. ¿Confirmo las fechas que habíamos apartado para ${format(conversation.project_details.next_trip_date, 'dd/MM/yyyy')}?`;
  } else {
    message += ` Si quieres continuar con tu proyecto, ¿cuándo te gustaría agendar la próxima sesión?`;
  }

  return message;
}
```

#### Análisis con Gemini Vision (Opcional)

**AI Analysis Service:**
```typescript
// healing/ai-analysis.service.ts
async analyzeHealingWithGemini(imageUrl: string, week: number): Promise<HealingAnalysis> {
  const response = await this.gemini.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { 
          inlineData: {
            mimeType: 'image/jpeg',
            data: await this.fetchImageAsBase64(imageUrl)
          }
        },
        { 
          text: `Analiza esta foto de un tatuaje en proceso de cicatrización (semana ${week}).
                 
                 Evalúa:
                 1. Estado general de cicatrización (normal/preocupante)
                 2. Signos de infección (enrojecimiento excesivo, pus, inflamación)
                 3. Retención de tinta
                 4. Descamación (normal para la semana)
                 5. Recomendaciones específicas
                 
                 Responde en formato JSON con estructura:
                 {
                   "status": "normal" | "warning" | "critical",
                   "observations": ["...", "..."],
                   "recommendations": ["...", "..."],
                   "alert_artist": boolean
                 }`
        }
      ]
    }]
  });

  return JSON.parse(response.text());
}

async notifyArtistHealingUpdate(checkpoint: HealingCheckpoint, analysis: HealingAnalysis) {
  const artist = checkpoint.session.artist;
  
  let message = `📸 Check-in semana ${checkpoint.checkpoint_number} de ${checkpoint.conversation.client_name}

Estado: ${this.getStatusEmoji(analysis.status)} ${analysis.status.toUpperCase()}`;

  if (analysis.alert_artist) {
    message += `\n\n⚠️ ATENCIÓN: ${analysis.observations.join(', ')}`;
  }

  message += `\n\nVer foto: [Dashboard Link]`;

  await this.whatsappService.sendMessage(
    artist.phone_number,
    message
  );
}

getStatusEmoji(status: string): string {
  const emojis = {
    'normal': '✅',
    'warning': '⚠️',
    'critical': '🚨'
  };
  return emojis[status] || '📋';
}
```

#### Dashboard de Seguimiento

**Metrics Service:**
```typescript
// dashboard/healing-metrics.service.ts
async getHealingMetrics(artistId: string) {
  const activeCheckpoints = await this.healingCheckpointRepo
    .createQueryBuilder('hc')
    .innerJoin('hc.session', 's')
    .where('s.artist_id = :artistId', { artistId })
    .andWhere('hc.status = :status', { status: 'pending' })
    .getCount();

  const completedThisMonth = await this.healingCheckpointRepo
    .createQueryBuilder('hc')
    .innerJoin('hc.session', 's')
    .where('s.artist_id = :artistId', { artistId })
    .andWhere('hc.status = :status', { status: 'completed' })
    .andWhere('hc.photo_received_at >= :startDate', { startDate: startOfMonth(new Date()) })
    .getCount();

  const responseRate = await this.calculateResponseRate(artistId);

  return {
    activeCheckpoints,
    completedThisMonth,
    responseRate,
    pendingReminders: await this.getPendingRemindersCount(artistId)
  };
}

async calculateResponseRate(artistId: string): Promise<number> {
  const sent = await this.healingCheckpointRepo
    .createQueryBuilder('hc')
    .innerJoin('hc.session', 's')
    .where('s.artist_id = :artistId', { artistId })
    .andWhere('hc.reminder_sent = true')
    .getCount();

  const responded = await this.healingCheckpointRepo
    .createQueryBuilder('hc')
    .innerJoin('hc.session', 's')
    .where('s.artist_id = :artistId', { artistId })
    .andWhere('hc.photo_received = true')
    .getCount();

  return sent > 0 ? (responded / sent) * 100 : 0;
}
```

### Automatización de Próximas Sesiones

**Auto-scheduling Service:**
```typescript
// calendar/auto-scheduler.service.ts
async handleFinalHealingCheckpoint(checkpoint: HealingCheckpoint) {
  if (checkpoint.checkpoint_number !== 3) return;
  if (!checkpoint.photo_received) return;

  const conversation = checkpoint.conversation;
  
  // Verificar si el proyecto tiene más sesiones pendientes
  const totalSessions = conversation.project_details?.estimated_sessions || 0;
  const completedSessions = await this.countCompletedSessions(conversation.id);

  if (completedSessions < totalSessions) {
    // Hay más sesiones pendientes
    const nextTripDate = conversation.project_details?.next_trip_date;
    
    if (nextTripDate && !isPast(nextTripDate)) {
      // Ya hay fecha programada - recordar
      await this.sendNextTripReminder(conversation, nextTripDate);
    } else {
      // Ofrecer disponibilidad
      await this.offerNextTripScheduling(conversation);
    }
  } else {
    // Proyecto completado
    await this.sendProjectCompletionMessage(conversation);
  }
}

async sendNextTripReminder(conversation: Conversation, tripDate: Date) {
  const message = `¡Tu tatuaje está perfectamente curado! 🎉

Tu próxima sesión está programada para ${format(tripDate, 'dd/MM/yyyy')}. ¿Seguimos con esa fecha o prefieres moverla?`;

  await this.whatsappService.sendMessage(
    conversation.client_phone,
    message
  );
}

async offerNextTripScheduling(conversation: Conversation) {
  const availableSlots = await this.getNextAvailableSlots(
    conversation.artist_id,
    3
  );

  const message = `¡Cicatrización completada! Tu piel está lista para continuar 💪

Tengo estos espacios disponibles para tu próximo viaje:

${availableSlots.map((slot, i) => 
  `${i + 1}. ${format(slot.date, 'dd/MM/yyyy')} - ${slot.description}`
).join('\n')}

¿Cuál te acomoda mejor?`;

  await this.whatsappService.sendMessage(
    conversation.client_phone,
    message
  );
}
```

---

## � Motor de Búsqueda de Portafolio

### Arquitectura de Búsqueda Inteligente

El sistema permite buscar trabajos del artista mediante lenguaje natural, aprovechando embeddings semánticos y tags categorizados.

#### Modelo de Base de Datos Extendido

**Tabla: portfolio_images**
```sql
CREATE TABLE portfolio_images (
  id UUID PRIMARY KEY,
  artist_id UUID REFERENCES artists(id),
  session_id UUID REFERENCES appointments(id),
  healing_checkpoint_id UUID REFERENCES healing_checkpoints(id),
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) DEFAULT 'healed', -- 'healed' | 'stencil' | 'process'
  
  -- Metadatos extraídos por Gemini Vision
  style VARCHAR(50), -- 'Neo-Japonés', 'Realismo', 'Tradicional', etc.
  main_elements TEXT[], -- ['Dragón', 'Flores', 'Koi']
  body_zone VARCHAR(50), -- 'Manga completa', 'Espalda', 'Pierna', etc.
  color_palette VARCHAR(50), -- 'Blanco y negro', 'Color', 'Monocromático'
  size_category VARCHAR(20), -- 'small', 'medium', 'large', 'full_coverage'
  tags TEXT[], -- Tags generados automáticamente
  
  -- Búsqueda semántica
  description TEXT,
  embedding VECTOR(768),
  
  -- Información del proyecto
  client_name VARCHAR(100),
  completion_date DATE,
  session_count INT,
  
  -- Control
  is_public BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_artist ON portfolio_images(artist_id);
CREATE INDEX idx_portfolio_style ON portfolio_images(style);
CREATE INDEX idx_portfolio_zone ON portfolio_images(body_zone);
CREATE INDEX idx_portfolio_tags ON portfolio_images USING GIN(tags);
CREATE INDEX idx_portfolio_elements ON portfolio_images USING GIN(main_elements);
CREATE INDEX idx_portfolio_embedding ON portfolio_images USING ivfflat(embedding vector_cosine_ops);
```

### Proceso de Catalogación Automática

**Servicio de Portafolio:**
```typescript
// portfolio/portfolio.service.ts
async addToPortfolio(checkpoint: HealingCheckpoint, imageUrl: string) {
  console.log(`Adding healed tattoo to portfolio for session ${checkpoint.session_id}`);

  // 1. Analizar imagen con Gemini Vision
  const analysis = await this.analyzeCompletedTattooWithGemini(imageUrl);

  // 2. Generar descripción para embedding
  const description = this.generateDescription(analysis);

  // 3. Generar embedding semántico
  const embedding = await this.gemini.embedContent({
    model: 'embedding-001',
    content: description
  });

  // 4. Crear entrada en portafolio
  const portfolioImage = await this.portfolioRepo.create({
    artist_id: checkpoint.session.artist_id,
    session_id: checkpoint.session_id,
    healing_checkpoint_id: checkpoint.id,
    image_url: imageUrl,
    image_type: 'healed',
    style: analysis.style,
    main_elements: analysis.main_elements,
    body_zone: analysis.body_zone,
    color_palette: analysis.color_palette,
    size_category: analysis.size_category,
    tags: analysis.tags,
    description: description,
    embedding: embedding.values,
    client_name: checkpoint.conversation.client_name,
    completion_date: new Date(),
    session_count: await this.getSessionCount(checkpoint.session_id),
    is_public: true
  });

  console.log(`Portfolio entry created with tags: ${analysis.tags.join(', ')}`);

  return portfolioImage;
}

generateDescription(analysis: TattooAnalysis): string {
  return `${analysis.style} tattoo featuring ${analysis.main_elements.join(', ')} on ${analysis.body_zone}. ${analysis.color_palette} color palette. ${analysis.additional_details || ''}`.trim();
}
```

### Análisis Avanzado con Gemini Vision

**AI Analysis Service:**
```typescript
// portfolio/ai-analysis.service.ts
async analyzeCompletedTattooWithGemini(imageUrl: string): Promise<TattooAnalysis> {
  const response = await this.gemini.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { 
          inlineData: {
            mimeType: 'image/jpeg',
            data: await this.fetchImageAsBase64(imageUrl)
          }
        },
        { 
          text: `Analiza este tatuaje completamente cicatrizado y extrae metadatos detallados.

INSTRUCCIONES:
1. Identifica el estilo principal (Neo-Japonés, Realismo, Tradicional, Minimalista, Geométrico, Biomecánico, etc.)
2. Lista los elementos principales (Dragón, Flores, Calavera, Animal, Retrato, etc.)
3. Determina la zona del cuerpo (Manga completa, Media manga, Espalda completa, Pierna, Brazo, etc.)
4. Identifica la paleta de colores (Blanco y negro, Color completo, Monocromático, Tonos grises)
5. Clasifica el tamaño (small: <10cm, medium: 10-20cm, large: 20-40cm, full_coverage: >40cm)
6. Genera 5-8 tags descriptivos en español

Responde SOLO en formato JSON válido:
{
  "style": "string",
  "main_elements": ["element1", "element2", "element3"],
  "body_zone": "string",
  "color_palette": "string",
  "size_category": "small|medium|large|full_coverage",
  "tags": ["#Tag1", "#Tag2", "#Tag3"],
  "additional_details": "Descripción breve de elementos únicos"
}`
        }
      ]
    }]
  });

  const analysisText = response.text();
  // Limpiar posibles markdown code blocks
  const jsonText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(jsonText);
}
```

### Sistema de Búsqueda Multi-Modal

**Search Service:**
```typescript
// portfolio/search.service.ts
async searchPortfolio(
  artistId: string,
  query: string,
  filters?: PortfolioFilters,
  limit: number = 10
): Promise<PortfolioImage[]> {
  
  // 1. Determinar tipo de búsqueda
  const searchType = this.detectSearchType(query);

  let results: PortfolioImage[] = [];

  switch (searchType) {
    case 'semantic':
      results = await this.semanticSearch(artistId, query, limit);
      break;
    
    case 'tag':
      results = await this.tagSearch(artistId, query, limit);
      break;
    
    case 'filter':
      results = await this.filterSearch(artistId, filters, limit);
      break;
    
    case 'hybrid':
      results = await this.hybridSearch(artistId, query, filters, limit);
      break;
  }

  return results;
}

detectSearchType(query: string): 'semantic' | 'tag' | 'filter' | 'hybrid' {
  // Si la query contiene # es búsqueda por tag
  if (query.includes('#')) return 'tag';
  
  // Si tiene palabras clave específicas, es filtro
  const filterKeywords = ['manga', 'espalda', 'pierna', 'brazo', 'color', 'blanco y negro'];
  const hasFilterKeywords = filterKeywords.some(kw => query.toLowerCase().includes(kw));
  
  if (hasFilterKeywords) return 'hybrid';
  
  // Por defecto, búsqueda semántica
  return 'semantic';
}

async semanticSearch(artistId: string, query: string, limit: number) {
  // 1. Generar embedding de la query
  const queryEmbedding = await this.gemini.embedContent({
    model: 'embedding-001',
    content: query
  });

  // 2. Búsqueda por similitud
  const { data } = await this.supabase.rpc('search_portfolio', {
    artist_id: artistId,
    query_embedding: queryEmbedding.values,
    match_threshold: 0.6,
    match_count: limit
  });

  return data;
}

async tagSearch(artistId: string, query: string, limit: number) {
  // Extraer tags de la query
  const tags = query.match(/#\w+/g) || [];
  
  return await this.portfolioRepo
    .createQueryBuilder('p')
    .where('p.artist_id = :artistId', { artistId })
    .andWhere('p.tags && :tags', { tags })
    .orderBy('p.created_at', 'DESC')
    .limit(limit)
    .getMany();
}

async hybridSearch(artistId: string, query: string, filters: PortfolioFilters, limit: number) {
  // Combinar búsqueda semántica con filtros estructurados
  const semanticResults = await this.semanticSearch(artistId, query, limit * 2);
  
  // Aplicar filtros adicionales
  return semanticResults.filter(img => {
    if (filters.style && img.style !== filters.style) return false;
    if (filters.body_zone && img.body_zone !== filters.body_zone) return false;
    if (filters.color_palette && img.color_palette !== filters.color_palette) return false;
    return true;
  }).slice(0, limit);
}
```

**Función SQL de Búsqueda:**
```sql
CREATE OR REPLACE FUNCTION search_portfolio(
  artist_id UUID,
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  style VARCHAR(50),
  main_elements TEXT[],
  body_zone VARCHAR(50),
  tags TEXT[],
  client_name VARCHAR(100),
  completion_date DATE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.image_url,
    p.style,
    p.main_elements,
    p.body_zone,
    p.tags,
    p.client_name,
    p.completion_date,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM portfolio_images p
  WHERE p.artist_id = search_portfolio.artist_id
    AND p.is_public = true
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Integración con WhatsApp

**WhatsApp Portfolio Handler:**
```typescript
// whatsapp/portfolio-handler.service.ts
async handlePortfolioRequest(message: WhatsAppMessage, conversation: Conversation) {
  const query = message.text.body;
  
  // Detectar intención de búsqueda
  const searchPatterns = [
    /muestra|enseña|ver|ejemplo|referencia/i,
    /has hecho|trabajos|portafolio|galería/i,
    /dragon|flores|calavera|animal/i
  ];

  const isSearchRequest = searchPatterns.some(pattern => pattern.test(query));

  if (!isSearchRequest) return false;

  // Extraer query de búsqueda
  const searchQuery = this.extractSearchQuery(query);

  // Buscar en portafolio
  const results = await this.portfolioSearchService.searchPortfolio(
    conversation.artist_id,
    searchQuery,
    null,
    6 // Máximo 6 imágenes por mensaje WhatsApp
  );

  if (results.length === 0) {
    await this.whatsappService.sendMessage(
      conversation.client_phone,
      `No encontré trabajos que coincidan con "${searchQuery}". ¿Podrías ser más específico o probar con otras palabras?`
    );
    return true;
  }

  // Enviar mensaje introductorio
  await this.whatsappService.sendMessage(
    conversation.client_phone,
    `¡Claro! ${this.getSearchResultsIntro(searchQuery, results.length)}`
  );

  // Enviar imágenes (máximo 3 a la vez en WhatsApp)
  const batches = this.chunkArray(results, 3);
  
  for (const batch of batches) {
    for (const image of batch) {
      await this.sendPortfolioImage(conversation.client_phone, image);
      await this.delay(500); // Pequeño delay entre imágenes
    }
  }

  // Enviar mensaje de seguimiento
  await this.sendFollowUpMessage(conversation, results);

  return true;
}

extractSearchQuery(text: string): string {
  // Remover palabras comunes de la query
  const cleanedText = text
    .replace(/muestra|enseña|ver|ejemplo|referencia|has hecho|trabajos|portafolio|galería/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleanedText || text;
}

getSearchResultsIntro(query: string, count: number): string {
  if (count === 1) {
    return `He encontrado un trabajo que coincide con "${query}". Te lo envío:`;
  }
  return `He encontrado ${count} proyectos relacionados con "${query}". Te envío algunos de los más impresionantes:`;
}

async sendPortfolioImage(clientPhone: string, image: PortfolioImage) {
  // Enviar imagen con caption
  const caption = this.generateImageCaption(image);
  
  await this.whatsappService.sendImageMessage(
    clientPhone,
    image.image_url,
    caption
  );
}

generateImageCaption(image: PortfolioImage): string {
  const elements = image.main_elements.join(', ');
  const tags = image.tags.slice(0, 3).join(' ');
  
  return `${image.style} - ${image.body_zone}
📅 ${format(image.completion_date, 'MMM yyyy')}
🎨 ${elements}
${tags}`;
}

async sendFollowUpMessage(conversation: Conversation, results: PortfolioImage[]) {
  const hasMoreResults = results.length >= 6;
  
  let message = `\n¿Alguno de estos se acerca a lo que tienes en mente?`;
  
  if (hasMoreResults) {
    message += `\n\nTengo más ejemplos si quieres ver otras opciones.`;
  }

  await this.whatsappService.sendMessage(
    conversation.client_phone,
    message
  );
}

chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Búsqueda para el Artista

**Artist Portfolio Handler:**
```typescript
// whatsapp/artist-portfolio-handler.service.ts
async handleArtistPortfolioRequest(message: WhatsAppMessage, artist: Artist) {
  const query = message.text.body;
  
  // Detectar comandos del artista
  const commands = {
    search: /busca|encuentra|muestra|dame/i,
    stats: /cuantos|estadísticas|total/i,
    recent: /recientes|últimos|nuevos/i
  };

  if (commands.search.test(query)) {
    await this.handleArtistSearch(artist, query);
  } else if (commands.stats.test(query)) {
    await this.handlePortfolioStats(artist);
  } else if (commands.recent.test(query)) {
    await this.handleRecentWorks(artist, query);
  }
}

async handleArtistSearch(artist: Artist, query: string) {
  const searchQuery = this.extractSearchQuery(query);
  
  const results = await this.portfolioSearchService.searchPortfolio(
    artist.id,
    searchQuery,
    null,
    12 // El artista puede ver más resultados
  );

  if (results.length === 0) {
    await this.whatsappService.sendMessage(
      artist.phone_number,
      `No encontré trabajos con "${searchQuery}".`
    );
    return;
  }

  // Ofrecer opciones de organización
  await this.whatsappService.sendMessage(
    artist.phone_number,
    `He encontrado ${results.length} trabajos con "${searchQuery}".

¿Cómo los quieres:
1️⃣ Por fecha (más recientes primero)
2️⃣ Por estilo
3️⃣ Todos juntos
4️⃣ Solo los destacados

Responde con el número.`
  );

  // Guardar contexto para siguiente mensaje
  await this.saveSearchContext(artist.id, results, 'portfolio_search');
}

async handlePortfolioStats(artist: Artist) {
  const stats = await this.portfolioRepo
    .createQueryBuilder('p')
    .select('p.style', 'style')
    .addSelect('COUNT(*)', 'count')
    .where('p.artist_id = :artistId', { artistId: artist.id })
    .groupBy('p.style')
    .orderBy('count', 'DESC')
    .getRawMany();

  const total = await this.portfolioRepo.count({ where: { artist_id: artist.id } });

  let message = `📊 Estadísticas de tu Portafolio\n\nTotal de obras: ${total}\n\nPor estilo:\n`;
  
  stats.forEach(stat => {
    message += `• ${stat.style}: ${stat.count}\n`;
  });

  await this.whatsappService.sendMessage(artist.phone_number, message);
}
```

### Optimización de Búsqueda

**Cache Service:**
```typescript
// portfolio/cache.service.ts
@Injectable()
export class PortfolioCacheService {
  constructor(
    @Inject('REDIS') private redis: Redis
  ) {}

  async cachePopularSearches(artistId: string) {
    // Pre-cachear búsquedas comunes
    const popularQueries = [
      'dragones',
      'mangas completas',
      'blanco y negro',
      'espalda',
      'flores'
    ];

    for (const query of popularQueries) {
      const cacheKey = `portfolio:${artistId}:${query}`;
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        const results = await this.searchService.searchPortfolio(artistId, query);
        await this.redis.setex(cacheKey, 3600, JSON.stringify(results)); // 1 hora
      }
    }
  }

  async getCachedSearch(artistId: string, query: string): Promise<PortfolioImage[] | null> {
    const cacheKey = `portfolio:${artistId}:${query.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    
    return cached ? JSON.parse(cached) : null;
  }
}
```

---

## �📊 Monitoreo y Analytics

### Eventos Rastreados

```typescript
// common/analytics.service.ts
enum AnalyticsEvent {
  // Conversión
  INQUIRY_RECEIVED = 'inquiry_received',
  LEAD_QUALIFIED = 'lead_qualified',
  DEPOSIT_PAID = 'deposit_paid',
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  
  // Operación
  IMAGE_PROCESSED = 'image_processed',
  REMINDER_SENT = 'reminder_sent',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  
  // Crisis
  CANCELLATION_RECEIVED = 'cancellation_received',
  GAP_FILLED = 'gap_filled',
  EMERGENCY_HANDLED = 'emergency_handled',
  
  // Engagement
  MESSAGE_SENT = 'message_sent',
  MESSAGE_READ = 'message_read',
  FOLLOWUP_TRIGGERED = 'followup_triggered',
  
  // Seguimiento Post-Sesión
  HEALING_CHECKPOINT_SCHEDULED = 'healing_checkpoint_scheduled',
  HEALING_REMINDER_SENT = 'healing_reminder_sent',
  HEALING_PHOTO_RECEIVED = 'healing_photo_received',
  HEALING_COMPLETED = 'healing_completed',
  
  // Portafolio
  PORTFOLIO_IMAGE_ADDED = 'portfolio_image_added',
  PORTFOLIO_SEARCH_PERFORMED = 'portfolio_search_performed',
  PORTFOLIO_IMAGE_SHARED = 'portfolio_image_shared'
}

async trackEvent(event: AnalyticsEvent, properties: any) {
  await this.supabase.from('analytics_events').insert({
    event_name: event,
    properties: properties,
    timestamp: new Date()
  });
}
```

### Dashboard KPIs

**Métricas en Tiempo Real:**
```typescript
// dashboard/metrics.service.ts
async getRealtimeMetrics(artistId: string) {
  const today = startOfDay(new Date());
  const thisMonth = startOfMonth(new Date());

  return {
    today: {
      inquiries: await this.countEvents('inquiry_received', today),
      qualified: await this.countEvents('lead_qualified', today),
      deposits: await this.sumRevenue('deposit_paid', today),
      appointments: await this.countAppointments(today)
    },
    thisMonth: {
      revenue: await this.sumRevenue('deposit_paid', thisMonth),
      conversionRate: await this.calculateConversionRate(thisMonth),
      noShowRate: await this.calculateNoShowRate(thisMonth),
      avgResponseTime: await this.calculateAvgResponseTime(thisMonth)
    },
    pipeline: {
      inInquiry: await this.countByStage('inquiry'),
      qualified: await this.countByStage('qualified'),
      deposited: await this.countByStage('deposited'),
      scheduled: await this.countByStage('scheduled')
    }
  };
}
```

---

## 🔐 Seguridad

### Validación de Webhooks

**WhatsApp Signature Validation:**
```typescript
// whatsapp/security.service.ts
validateWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Rate Limiting

```typescript
// common/guards/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientPhone = request.body.from;

    // Máximo 10 mensajes por minuto
    const count = await this.redis.incr(`rate_limit:${clientPhone}`);
    
    if (count === 1) {
      await this.redis.expire(`rate_limit:${clientPhone}`, 60);
    }

    return count <= 10;
  }
}
```

---

## 🎯 Conclusión

Este documento describe la implementación técnica completa de Ghostline, desde la recepción de mensajes de WhatsApp hasta la gestión de crisis. Cada componente está diseñado para ser escalable, resiliente y fácil de mantener.

### Próximos Pasos de Implementación

1. **Fase 1:** WhatsApp webhook + Gemini básico
2. **Fase 2:** Procesamiento de imágenes (S3 + Lambda)
3. **Fase 3:** Sistema de agendamiento
4. **Fase 4:** Gestión de pagos
5. **Fase 5:** Búsqueda semántica básica
6. **Fase 6:** Protocolos de crisis automatizados
7. **Fase 7:** Seguimiento post-sesión y cicatrización
8. **Fase 8:** Motor de búsqueda de portafolio con Gemini Vision

Ver [CHATBOT-FLOW.md](CHATBOT-FLOW.md) para la lógica de negocio y [STRUCTURE.md](STRUCTURE.md) para la organización del código.
