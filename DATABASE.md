# Modelo de Base de Datos - Ghostline

Este documento describe el modelo de base de datos completo del sistema Ghostline, incluyendo todas las tablas, relaciones y justificaciones de diseño.

---

## Diagrama Entidad-Relación

```
═══════════════════════════════════════════════════════════════════════════════
                    DIAGRAMA ENTIDAD-RELACIÓN - GHOSTLINE
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────┐
│         ARTISTS                 │  ← Configuración del Tatuador
├─────────────────────────────────┤
│ PK  id                          │
│     name                        │
│     whatsapp_business_id        │
│     email                       │
│     rates                       │ (JSONB: tarifas y depósitos)
│     methodology                 │ (JSONB: horarios y días de trabajo) ⭐
│     style_preferences           │ (JSONB: especialidades y restricciones)
│     bio                         │
│     instagram_handle            │
│     website                     │
│     timezone                    │
│     google_calendar_config      │ (JSONB: OAuth tokens)
│     stripe_config               │ (JSONB: Stripe account)
│     is_active                   │
│     created_at                  │
│     updated_at                  │
└─────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────┐
│         CLIENTS                 │  ← Información del Cliente
├─────────────────────────────────┤
│ PK  id                          │
│ FK  artist_id                   │
│     phone_number                │ (WhatsApp)
│     name                        │
│     email                       │
│     location                    │ (Ciudad para coordinar viajes)
│     total_spent                 │
│     projects_count              │
│     client_tier                 │ (prospect, active, vip)
│     last_appointment_date       │
│     created_at                  │
│     updated_at                  │
└─────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────┐
│      CONVERSATIONS              │  ← Estado de Conversación
├─────────────────────────────────┤
│ PK  id                          │
│ FK  client_id                   │
│ FK  artist_id                   │
│ FK  project_id                  │ (nullable)
│     status                      │ (active, closed, archived)
│     stage                       │ (inquiry, qualified, deposited, scheduled, completed)
│     context_summary             │ (JSON: resumen de la conversación)
│     extracted_variables         │ (JSON: idea, zona, tamaño, etc.)
│     client_ideas                │ (TEXT: historia personal y narrativa del cliente) ⭐
│     last_message_at             │
│     created_at                  │
│     updated_at                  │
└─────────────────────────────────┘
         │
         │ 1:N
         ├────────────────────────────────────────┐
         ▼                                        ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│        MESSAGES                 │    │   REFERENCE_IMAGES              │  ← Imágenes de Referencia del Cliente ⭐
├─────────────────────────────────┤    ├─────────────────────────────────┤
│ PK  id                          │    │ PK  id                          │
│ FK  conversation_id             │    │ FK  conversation_id             │
│     from_artist                 │    │ FK  client_id                   │
│     content                     │    │ FK  project_id                  │ (nullable)
│     message_type                │    │     s3_url                      │ (URL completa en S3)
│     whatsapp_message_id         │    │     thumbnail_url               │ (Miniatura para dashboard)
│     status                      │    │     whatsapp_media_id           │ (ID del media en WhatsApp)
│     metadata                    │    │     file_type                   │ (image/jpeg, image/png)
│     created_at                  │    │     file_size_kb                │
└─────────────────────────────────┘    │     order_index                 │ (1-6 para ordenar)
                                       │     description                 │ (opcional: qué representa)
                                       │     created_at                  │
                                       └─────────────────────────────────┘


┌─────────────────────────────────┐
│        PROJECTS                 │  ← Proyecto de Tatuaje
├─────────────────────────────────┤
│ PK  id                          │
│ FK  client_id                   │
│ FK  artist_id                   │
│     title                       │ ("Manga de Dragón - Javi")
│     description                 │
│     style                       │ (Neo-Japonés, etc.)
│     body_zone                   │ (brazo, espalda, pierna)
│     size_category               │ (pequeño, mediano, grande, completo)
│     estimated_sessions          │ (10)
│     total_sessions              │
│     session_rate                │ ($1,200)
│     total_cost                  │ ($12,000)
│     deposit_paid                │ (boolean)
│     deposit_amount              │
│     status                      │ (quoted, confirmed, in_progress, completed, cancelled)
│     trip_structure              │ (JSON: [4, 3, 3] días por viaje)
│     created_at                  │
│     updated_at                  │
└─────────────────────────────────┘
         │
         │ 1:N
         ├────────────────────────────────────────┐
         ▼                                        ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│      APPOINTMENTS               │    │      SESSIONS                   │  ← Sesiones Individuales
├─────────────────────────────────┤    ├─────────────────────────────────┤
│ PK  id                          │    │ PK  id                          │
│ FK  artist_id                   │    │ FK  project_id                  │
│ FK  client_id                   │    │ FK  appointment_id              │
│     start_time                  │    │     session_number              │ (1 de 10)
│     end_time                    │    │     trip_number                 │ (Viaje 1, 2, 3)
│     duration_hours              │    │     session_date                │
│     session_type                │     (large/small) │     duration_hours              │
│     status                      │    │     notes                       │ (Lo que se trabajó)
│     google_calendar_event_id    │    │     status                      │ (scheduled, completed, cancelled)
│     notes                       │    │     completed_at                │
│     reminder_24h_sent           │    │     created_at                  │
│     reminder_1h_sent            │    └─────────────────────────────────┘
│     created_at                  │              │
│     updated_at                  │              │ 1:N
└─────────────────────────────────┘              ▼
                                      ┌─────────────────────────────────┐
                                      │   HEALING_CHECKPOINTS           │  ← Seguimiento Cicatrización
                                      ├─────────────────────────────────┤
                                      │ PK  id                          │
                                      │ FK  session_id                  │
                                      │ FK  client_id                   │
                                      │     checkpoint_number           │ (1, 2, 3)
                                      │     due_date                    │ (Día 7, 14, 21)
                                      │     reminder_sent               │
                                      │     photo_submitted             │
                                      │     photo_s3_url                │
                                      │     status                      │ (pending, completed, overdue)
                                      │     ai_analysis                 │ (JSON: análisis Gemini)
                                      │     notes                       │
                                      │     completed_at                │
                                      │     created_at                  │
                                      └─────────────────────────────────┘
                                                │
                                                │ (checkpoint_number = 3)
                                                │ triggers →
                                                ▼
                                      ┌─────────────────────────────────┐
                                      │   PORTFOLIO_IMAGES              │  ← Galería Categorizada
                                      ├─────────────────────────────────┤
                                      │ PK  id                          │
                                      │ FK  artist_id                   │
                                      │ FK  project_id                  │
                                      │ FK  client_id                   │
                                      │ FK  healing_checkpoint_id       │
                                      │     s3_url                      │
                                      │     thumbnail_url               │
                                      │     style                       │ (Neo-Japonés)
                                      │     main_elements               │ (array: [Dragón, Flores])
                                      │     body_zone                   │ (Brazo)
                                      │     color_palette               │ (Blanco y Negro)
                                      │     size_category               │ (Grande)
                                      │     tags                        │ (array: [#Dragon, #NeoJaponés])
                                      │     description                 │ (generada por AI)
                                      │     embedding                   │ (vector para búsqueda semántica)
                                      │     is_featured                 │
                                      │     views_count                 │
                                      │     shares_count                │
                                      │     created_at                  │
                                      └─────────────────────────────────┘


┌─────────────────────────────────┐
│        DESIGNS                  │  ← Diseños del Artista (Bocetos/Stencils)
├─────────────────────────────────┤
│ PK  id                          │
│ FK  artist_id                   │
│ FK  project_id                  │ (nullable - puede ser genérico)
│     name                        │
│     original_s3_url             │ (/tattooer_id/originals/)
│     stencil_s3_url              │ (/tattooer_id/stencils/)
│     whatsapp_message_id         │
│     processing_status           │ (pending, processing, completed, failed)
│     lambda_job_id               │
│     tags                        │ (array: [#Hannya, #NeoJaponés])
│     ai_description              │
│     shared_with_client          │ (boolean)
│     created_at                  │
│     updated_at                  │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│        PAYMENTS                 │  ← Gestión de Pagos
├─────────────────────────────────┤
│ PK  id                          │
│ FK  client_id                   │
│ FK  artist_id                   │ ⭐ Relación con artista
│     stripe_payment_intent_id    │ (unique)
│     amount                      │
│     currency                    │ (USD, MXN, EUR)
│     status                      │ (pending, succeeded, failed, refunded)
│     payment_type                │ (deposit, final_payment, tip)
│     metadata                    │ (JSONB: project_id, session_id, checkout_session_id)
│     paid_at                     │
│     created_at                  │
│     updated_at                  │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│     GAP_FILLER_QUEUE            │  ← Sistema de Cancelaciones
├─────────────────────────────────┤
│ PK  id                          │
│ FK  artist_id                   │
│     cancelled_appointment_id    │
│     available_date              │
│     available_slots             │ (4 días continuos)
│     trip_type                   │ (tipo de proyecto compatible)
│     priority_clients            │ (array de client_ids contactados)
│     status                      │ (open, filled, expired)
│     filled_by_client_id         │
│     created_at                  │
│     filled_at                   │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│    PROSPECT_INTERACTIONS        │  ← Seguimiento de Prospectos
├─────────────────────────────────┤
│ PK  id                          │
│ FK  client_id                   │
│ FK  conversation_id             │
│     interaction_type            │ (message_sent, seen, no_response)
│     follow_up_status            │ (pending, sent, responded)
│     hours_since_last_message    │
│     created_at                  │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│    ANALYTICS_EVENTS             │  ← Métricas del Sistema
├─────────────────────────────────┤
│ PK  id                          │
│ FK  artist_id                   │
│ FK  client_id                   │
│     event_type                  │ (inquiry, qualified, deposit_paid, etc.)
│     event_data                  │ (JSON)
│     created_at                  │
└─────────────────────────────────┘


┌─────────────────────────────────┐
│    SEARCH_CACHE                 │  ← Cache de Búsquedas Populares
├─────────────────────────────────┤
│ PK  id                          │
│ FK  artist_id                   │
│     query                       │ ("dragones", "mangas", etc.)
│     query_embedding             │ (vector)
│     result_image_ids            │ (array de portfolio_images.id)
│     hit_count                   │
│     last_accessed               │
│     created_at                  │
└─────────────────────────────────┘
```

---

## Índices Importantes

### PORTFOLIO_IMAGES
```sql
-- Búsqueda rápida por tags
CREATE INDEX idx_portfolio_tags ON portfolio_images USING GIN(tags);

-- Búsqueda semántica con vectores
CREATE INDEX idx_portfolio_embedding ON portfolio_images 
  USING ivfflat(embedding vector_cosine_ops);

-- Filtros compuestos
CREATE INDEX idx_portfolio_filters ON portfolio_images(artist_id, style, body_zone);

-- Búsqueda por elementos
CREATE INDEX idx_portfolio_elements ON portfolio_images USING GIN(main_elements);
```

### REFERENCE_IMAGES ⭐
```sql
-- Obtener referencias por conversación
CREATE INDEX idx_reference_conversation ON reference_images(conversation_id, order_index);

-- Obtener referencias por cliente
CREATE INDEX idx_reference_client ON reference_images(client_id, created_at DESC);

-- Obtener referencias por proyecto
CREATE INDEX idx_reference_project ON reference_images(project_id) WHERE project_id IS NOT NULL;
```

### MESSAGES
```sql
-- Obtener historial de conversación
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- Búsqueda por mensaje de WhatsApp
CREATE INDEX idx_messages_whatsapp ON messages(whatsapp_message_id);
```

### CONVERSATIONS
```sql
-- Filtrar conversaciones activas por etapa
CREATE INDEX idx_conversations_status ON conversations(client_id, status, stage);

-- Detectar conversaciones inactivas
CREATE INDEX idx_conversations_inactive ON conversations(last_message_at) 
  WHERE status = 'active';
```

### APPOINTMENTS
```sql
-- Agenda del artista
CREATE INDEX idx_appointments_artist ON appointments(artist_id, start_time);

-- Por cliente y estado
CREATE INDEX idx_appointments_client ON appointments(client_id, status);

-- Por tipo de sesión
CREATE INDEX idx_appointments_session_type ON appointments(session_type);
```

### PAYMENTS
```sql
-- Pagos por cliente y estado
CREATE INDEX idx_payments_client ON payments(client_id, status);

-- Pagos por artista y estado
CREATE INDEX idx_payments_artist ON payments(artist_id, status);

-- Búsqueda por Stripe Payment Intent (unique)
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
```

### HEALING_CHECKPOINTS
```sql
-- Cron jobs para recordatorios
CREATE INDEX idx_healing_due ON healing_checkpoints(due_date, status) 
  WHERE status = 'pending';

-- Checkpoints por sesión
CREATE INDEX idx_healing_session ON healing_checkpoints(session_id, checkpoint_number);
```

---

## Relaciones Clave

```
ARTISTS (1) ──→ (N) CLIENTS
ARTISTS (1) ──→ (N) PROJECTS
ARTISTS (1) ──→ (N) DESIGNS
ARTISTS (1) ──→ (N) PORTFOLIO_IMAGES
ARTISTS (1) ──→ (N) APPOINTMENTS
ARTISTS (1) ──→ (N) PAYMENTS

CLIENTS (1) ──→ (N) CONVERSATIONS
CLIENTS (1) ──→ (N) PROJECTS
CLIENTS (1) ──→ (N) APPOINTMENTS
CLIENTS (1) ──→ (N) PAYMENTS
CLIENTS (1) ──→ (N) REFERENCE_IMAGES ⭐

CONVERSATIONS (1) ──→ (N) MESSAGES
CONVERSATIONS (1) ──→ (N) REFERENCE_IMAGES ⭐
CONVERSATIONS (1) ──→ (0-1) PROJECT

PROJECTS (1) ──→ (N) SESSIONS
PROJECTS (1) ──→ (N) REFERENCE_IMAGES (optional) ⭐

APPOINTMENTS (1) ──→ (1) CLIENT
APPOINTMENTS (1) ──→ (1) ARTIST

PAYMENTS (1) ──→ (1) CLIENT
PAYMENTS (1) ──→ (1) ARTIST

SESSIONS (1) ──→ (3) HEALING_CHECKPOINTS

HEALING_CHECKPOINTS (1) ──→ (0-1) PORTFOLIO_IMAGES
  └─ Solo el checkpoint #3 (día 21) genera imagen de portafolio
```

---

## Justificación de Diseño

### 1. Separación APPOINTMENTS vs SESSIONS

**¿Por qué dos tablas?**

- **APPOINTMENTS**: Bloques de calendario que pueden contener múltiples sesiones
- **SESSIONS**: Sesiones individuales de tatuaje que necesitan tracking específico

**Razón**: Un artista puede agendar un "viaje" de 4 días consecutivos (1 appointment), pero cada día es una sesión individual con su propio progreso y notas.

```
Appointment: "Viaje 1 - Manga de Javi" (4 días)
  ├─ Session 1: Día 1 - Líneas base
  ├─ Session 2: Día 2 - Fondos
  ├─ Session 3: Día 3 - Sombras principales
  └─ Session 4: Día 4 - Detalles superiores
```

---

### 2. HEALING_CHECKPOINTS como tabla independiente

**¿Por qué no un campo en SESSIONS?**

- Permite automatización con cron jobs (buscar checkpoints pendientes por fecha)
- Tracking independiente del estado de cada check-in (3 checkpoints por sesión)
- Facilita reportes de tasa de respuesta de clientes
- Relación limpia con PORTFOLIO_IMAGES

**Flujo**:
```
SESSION completa → Crea 3 HEALING_CHECKPOINTS (día 7, 14, 21)
  ├─ Checkpoint 1 (día 7): Recordatorio automático
  ├─ Checkpoint 2 (día 14): Recordatorio automático
  └─ Checkpoint 3 (día 21): Recordatorio automático + Agregar a PORTFOLIO
```

---

### 3. PORTFOLIO_IMAGES separado de DESIGNS

**Diferencia fundamental**:

- **DESIGNS**: Bocetos/Stencils del artista (ANTES del trabajo)
  - Subidos por el artista vía WhatsApp
  - Procesados por Lambda (Ghostline Engine)
  - Usados para mostrar al cliente antes de tatuar

- **PORTFOLIO_IMAGES**: Trabajos completados y cicatrizados (DESPUÉS)
  - Fotos del tatuaje finalizado (día 21)
  - Categorizadas automáticamente con Gemini Vision
  - Usadas para búsqueda y marketing

**Ejemplo**:
```
DESIGNS:
  - Boceto de dragón hecho por Carlos en iPad → Stencil generado

PORTFOLIO_IMAGES:
  - Foto del dragón tatuado y cicatrizado en el brazo de Javi
  - Tags: [#Dragón, #NeoJaponés, #Manga]
  - Búsqueda semántica habilitada
```

---

### 4. GAP_FILLER_QUEUE para gestión de cancelaciones

**¿Por qué tabla específica?**

- Manejo dedicado del protocolo de rescate de huecos
- Sistema de prioridad para contactar clientes
- Tracking de quién fue notificado y cuándo
- Métricas de eficiencia del gap filler

**Flujo**:
```
Cliente cancela → GAP_FILLER_QUEUE creado
  ├─ Busca clientes compatibles (style, trip_type)
  ├─ Ordena por prioridad (deposited > qualified)
  ├─ Contacta top 3 candidatos
  └─ Timeout de 2 horas → Expande búsqueda
```

---

### 5. SEARCH_CACHE para optimización

**Problema**: Generar embeddings con Gemini es costoso (tiempo + API calls)

**Solución**: Pre-cachear búsquedas populares

```sql
-- Queries comunes cacheadas
- "dragones" → [img1, img2, img3, ...]
- "mangas completas" → [img4, img5, img6, ...]
- "blanco y negro" → [img7, img8, img9, ...]
```

**Beneficio**:
- Respuesta instantánea para búsquedas frecuentes
- Reduce costos de API de Gemini
- Mejora UX del bot

---

### 6. Uso de JSONB para datos flexibles

**Campos que usan JSONB**:

```javascript
// artists.restrictions
["No tatuajes pequeños", "Mínimo 18 años", "No copias"]

// artists.project_methodology  
{
  "full_sleeve": { sessions: 10, trips: [4, 3, 3] },
  "back_piece": { sessions: 15, trips: [5, 5, 5] }
}

// conversation.extracted_variables
{
  "idea": "Dragón con flores",
  "zone": "Brazo completo",
  "size": "De hombro a muñeca",
  "location": "Ciudad de México"
}

// healing_checkpoint.ai_analysis
{
  "status": "normal",
  "observations": ["Cicatrización correcta", "Sin signos de infección"],
  "recommendations": ["Continuar con crema", "Evitar sol directo"]
}
```

**Ventaja**: Flexibilidad sin alterar schema cada vez que se agregan campos.

---

### 7. Vector embeddings con pgvector

**Extensión de PostgreSQL**: [pgvector](https://github.com/pgvector/pgvector)

**Uso en el sistema**:

```sql
-- Almacenar embedding de 768 dimensiones (Gemini)
ALTER TABLE portfolio_images 
  ADD COLUMN embedding VECTOR(768);

-- Búsqueda por similitud coseno
SELECT *, 1 - (embedding <=> query_embedding) AS similarity
FROM portfolio_images
WHERE 1 - (embedding <=> query_embedding) > 0.7
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

**Permite búsquedas como**:
- "Muéstrame dragones" (sin tag exacto)
- "Tatuajes en la espalda con flores" (combinado)
- "Estilo japonés tradicional" (semántico)

---

## Flujos de Datos Críticos

### Flujo 1: Nueva Consulta → Depósito

```
1. Cliente envía mensaje WhatsApp
   └─ CONVERSATIONS.stage = 'inquiry'
   
2. Bot extrae variables (idea, zona, tamaño)
   └─ CONVERSATIONS.extracted_variables (JSON)
   
3. Bot califica cliente
   └─ CONVERSATIONS.stage = 'qualified'
   
4. Bot genera link de pago Stripe
   └─ PAYMENTS creado (client_id, artist_id, status: 'pending', payment_type: 'deposit')
   
5. Cliente paga
   └─ PAYMENTS.status = 'succeeded'
   └─ PAYMENTS.paid_at = timestamp
   └─ CONVERSATIONS.stage = 'deposited'
   └─ PROJECTS creado (deposit_paid = true)
```

---

### Flujo 2: Imagen del Artista → Stencil

```
1. Artista envía foto por WhatsApp
   └─ MESSAGES (from_artist: true, type: 'image')
   
2. Bot sube a S3 /originals/
   └─ DESIGNS creado (processing_status: 'pending')
   
3. Lambda procesa imagen (OpenCV)
   └─ DESIGNS.processing_status = 'processing'
   └─ Stencil guardado en S3 /stencils/
   
4. Callback de Lambda
   └─ DESIGNS.processing_status = 'completed'
   └─ DESIGNS.stencil_s3_url actualizado
   
5. Gemini Vision analiza
   └─ DESIGNS.tags generados
   └─ Bot notifica al artista
```

---

### Flujo 3: Sesión Completada → Portafolio

```
1. Sesión de tatuaje completada
   └─ SESSIONS.status = 'completed'
   
2. Sistema crea checkpoints automáticamente
   └─ HEALING_CHECKPOINTS x3 (día 7, 14, 21)
   
3. Día 7: Cron job envía recordatorio
   └─ Cliente envía foto
   └─ HEALING_CHECKPOINTS[1].photo_submitted = true
   
4. Día 14: Segundo check-in
   └─ Cliente envía foto
   └─ HEALING_CHECKPOINTS[2].photo_submitted = true
   
5. Día 21: Check-in final
   └─ Cliente envía foto cicatrizada
   └─ HEALING_CHECKPOINTS[3].photo_submitted = true
   
6. Gemini Vision analiza foto final
   └─ Extrae: style, elements, zone, colors, size
   
7. Se agrega al portafolio
   └─ PORTFOLIO_IMAGES creado
   └─ Embedding generado para búsqueda semántica
   └─ Disponible para búsquedas inmediatas
```

---

### Flujo 4: Cliente Envía Imágenes de Referencia ⭐

```
1. Cliente envía mensaje de WhatsApp con imagen adjunta
   └─ WhatsApp webhook recibe media_id
   
2. Sistema descarga imagen desde WhatsApp Media API
   └─ Valida tipo de archivo (image/jpeg, image/png)
   └─ Valida que no exceda límite (máx 6 imágenes por conversación)
   
3. Sube imagen a S3
   └─ Ruta: s3://ghostline/references/{artist_id}/{conversation_id}/{order_index}_{timestamp}.jpg
   └─ Genera thumbnail para dashboard
   
4. Crea registro en REFERENCE_IMAGES
   └─ conversation_id, client_id, s3_url, thumbnail_url, whatsapp_media_id
   └─ order_index (1-6 secuencial)
   
5. Bot confirma recepción
   └─ "✅ Imagen de referencia guardada (3/6). ¿Quieres enviar más?"
   
6. Cuando cliente agenda cita
   └─ Sistema notifica al tatuador con link a galería de referencias
   └─ CONVERSATIONS.client_ideas se actualiza con contexto de las imágenes
   
7. Tatuador accede a referencias
   └─ Dashboard: GET /api/conversations/{id}/references
   └─ WhatsApp: Link directo a galería segura
```

**Límites y Validaciones:**
- Máximo 6 imágenes por conversación
- Formato soportado: JPEG, PNG
- Tamaño máximo por imagen: 10MB
- Si cliente excede límite, bot sugiere reemplazar imagen antigua

---

### Flujo 5: Cliente Busca Referencias

```
1. Cliente: "Quiero ver dragones"
   └─ Bot detecta intención de búsqueda
   
2. Sistema genera embedding de query
   └─ Verifica SEARCH_CACHE primero
   
3. Si no está cacheado:
   └─ Gemini genera embedding
   └─ Búsqueda en PORTFOLIO_IMAGES por similitud
   
4. Bot envía 3-4 imágenes más relevantes
   └─ ANALYTICS_EVENTS (portfolio_search_performed)
   
5. Cliente responde
   └─ Bot continúa conversación con contexto
```

---

## 🎯 Configuración Detallada del Artista

### Campo `methodology` (JSONB) - ⭐ Sistema de Sesiones Grandes vs Pequeñas

Este campo es el **corazón de la configuración del tatuador**. Permite diferenciar entre **sesiones grandes** (proyectos completos de 6-8 horas) y **sesiones pequeñas** (tatuajes rápidos de 1-3 horas), optimizando la agenda del artista.

#### 🎯 Concepto Principal

**Un día puede tener:**
- ✅ **1 sesión grande** (6-8 horas) → Bloquea todo el día
- ✅ **Múltiples sesiones pequeñas** (1-3 horas c/u) → Hasta X sesiones con descansos

**No se permite mezclar ambas** (configurable por artista)

#### Estructura Completa

```typescript
methodology: {
  // ═══ CONFIGURACIÓN DE SESIONES GRANDES ═══
  large_session: {
    duration_hours: 8,          // Duración de sesión grande (6-8 horas típico)
    max_per_day: 1,             // Usualmente 1 (sesión de día completo)
    requires_full_day: true     // Si true: al agendar grande, NO permite pequeñas
  },
  
  // ═══ CONFIGURACIÓN DE SESIONES PEQUEÑAS ═══
  small_session: {
    min_duration_hours: 1,                    // Mínimo para sesión pequeña
    max_duration_hours: 3,                    // Máximo (threshold para "pequeña")
    max_per_day: 4,                           // Máximo de sesiones pequeñas al día
    break_between_sessions_minutes: 30        // Descanso entre sesiones pequeñas
  },
  
  // ═══ DÍAS DE TRABAJO (0=Domingo, 6=Sábado) ═══
  working_days: [1, 2, 3, 4, 5],       // Lun-Vie
  // Ejemplos:
  // [1, 2, 3, 4, 5, 6] = Lun-Sab
  // [2, 3, 4] = Mar-Jue (solo 3 días)
  // [1, 2, 3, 4, 5, 0, 6] = Toda la semana
  
  // ═══ HORARIO LABORAL DIARIO ═══
  work_start_time: "09:00",            // Inicio del día
  work_end_time: "18:00",              // Fin del día
  
  // ═══ METODOLOGÍA DE PROYECTOS ═══
  trip_structures: {
    "full_sleeve": {
      estimated_sessions: 10,
      session_type: "large",           // ⭐ NUEVO: Especifica tipo de sesión
      trip_breakdown: [4, 3, 3],
      min_days_between_trips: 21
    },
    "small_tattoo": {
      estimated_sessions: 1,
      session_type: "small",           // ⭐ Sesión pequeña
      trip_breakdown: [1],
      min_days_between_trips: 0
    }
  },
  
  // ═══ PREFERENCIAS DE RESERVA ═══
  advance_booking_days: 14,
  max_advance_booking_days: 90,
  cancellation_notice_hours: 48,
  
  // ═══ CONFIGURACIONES ESPECIALES ═══
  accepts_walk_ins: false,
  consultation_required: true,
  consultation_duration_minutes: 30
}
```

#### Ejemplos de Configuración por Tipo de Artista

**🎨 Artista Rockstar (Solo Proyectos Grandes):**
```json
{
  "large_session": {
    "duration_hours": 8,
    "max_per_day": 1,
    "requires_full_day": true
  },
  "small_session": {
    "min_duration_hours": 1,
    "max_duration_hours": 3,
    "max_per_day": 0,
    "break_between_sessions_minutes": 0
  },
  "working_days": [1, 2, 3, 4],
  "work_start_time": "10:00",
  "work_end_time": "18:00",
  "trip_structures": {
    "full_sleeve": {
      "estimated_sessions": 10,
      "session_type": "large",
      "trip_breakdown": [4, 3, 3],
      "min_days_between_trips": 21
    },
    "back_piece": {
      "estimated_sessions": 15,
      "session_type": "large",
      "trip_breakdown": [5, 5, 5],
      "min_days_between_trips": 28
    }
  },
  "advance_booking_days": 30,
  "cancellation_notice_hours": 72,
  "accepts_walk_ins": false,
  "consultation_required": true
}
```

**⚡ Artista de Tatuajes Rápidos (Solo Sesiones Pequeñas):**
```json
{
  "large_session": {
    "duration_hours": 6,
    "max_per_day": 0,
    "requires_full_day": true
  },
  "small_session": {
    "min_duration_hours": 1,
    "max_duration_hours": 3,
    "max_per_day": 5,
    "break_between_sessions_minutes": 15
  },
  "working_days": [1, 2, 3, 4, 5, 6],
  "work_start_time": "11:00",
  "work_end_time": "20:00",
  "trip_structures": {
    "small_tattoo": {
      "estimated_sessions": 1,
      "session_type": "small",
      "trip_breakdown": [1]
    },
    "medium_tattoo": {
      "estimated_sessions": 2,
      "session_type": "small",
      "trip_breakdown": [1, 1],
      "min_days_between_trips": 14
    }
  },
  "advance_booking_days": 7,
  "cancellation_notice_hours": 24,
  "accepts_walk_ins": true,
  "consultation_required": false
}
```

**🎯 Artista Híbrido (Ambos Tipos - Exclusivo):**
```json
{
  "large_session": {
    "duration_hours": 7,
    "max_per_day": 1,
    "requires_full_day": true
  },
  "small_session": {
    "min_duration_hours": 1,
    "max_duration_hours": 3,
    "max_per_day": 3,
    "break_between_sessions_minutes": 20
  },
  "working_days": [1, 2, 3, 4, 5],
  "work_start_time": "09:00",
  "work_end_time": "18:00",
  "trip_structures": {
    "full_sleeve": {
      "estimated_sessions": 8,
      "session_type": "large",
      "trip_breakdown": [3, 3, 2],
      "min_days_between_trips": 21
    },
    "small_tattoo": {
      "estimated_sessions": 1,
      "session_type": "small",
      "trip_breakdown": [1]
    }
  },
  "advance_booking_days": 14,
  "cancellation_notice_hours": 48,
  "accepts_walk_ins": false,
  "consultation_required": true
}
```

**🌟 Artista Flexible (Puede Mezclar Sesiones):**
```json
{
  "large_session": {
    "duration_hours": 6,
    "max_per_day": 1,
    "requires_full_day": false
  },
  "small_session": {
    "min_duration_hours": 1,
    "max_duration_hours": 2,
    "max_per_day": 2,
    "break_between_sessions_minutes": 30
  },
  "working_days": [2, 3, 4, 5, 6],
  "work_start_time": "10:00",
  "work_end_time": "19:00",
  "trip_structures": {
    "medium_piece": {
      "estimated_sessions": 4,
      "session_type": "large",
      "trip_breakdown": [2, 2],
      "min_days_between_trips": 14
    }
  },
  "advance_booking_days": 10,
  "cancellation_notice_hours": 48
}
```

---

### 🤖 Lógica de Validación del Bot

**Al agendar una cita, el bot verifica:**

#### 1. Validación de Tipo de Sesión
```typescript
if (requested_duration >= artist.methodology.small_session.max_duration_hours) {
  session_type = 'large';
} else {
  session_type = 'small';
}
```

#### 2. Validación de Conflictos
```typescript
if (session_type === 'large' && artist.methodology.large_session.requires_full_day) {
  // Verificar que NO haya sesiones pequeñas ese día
  if (existingSmallSessions.length > 0) {
    return "⚠️ Este día ya tiene sesiones pequeñas agendadas";
  }
}

if (session_type === 'small') {
  // Verificar que NO haya sesión grande ese día
  if (existingLargeSession && artist.methodology.large_session.requires_full_day) {
    return "⚠️ Este día tiene una sesión grande agendada";
  }
  
  // Verificar límite de sesiones pequeñas
  if (existingSmallSessions.length >= artist.methodology.small_session.max_per_day) {
    return "⚠️ Se alcanzó el límite de sesiones pequeñas para este día";
  }
}
```

#### 3. Validación de Horarios y Breaks
```typescript
// Verificar horario laboral
if (appointment_time < work_start_time || appointment_end_time > work_end_time) {
  return "⚠️ Fuera del horario laboral";
}

// Verificar break entre sesiones (solo para small sessions)
if (session_type === 'small') {
  const minBreak = artist.methodology.small_session.break_between_sessions_minutes;
  if (!hasMinimumBreak(existingSmallSessions, appointment_time, minBreak)) {
    return `⚠️ Se requiere al menos ${minBreak} minutos entre sesiones`;
  }
}
```

#### 4. Validación de Días de Trabajo
```typescript
const dayOfWeek = new Date(appointment_date).getDay();
if (!artist.methodology.working_days.includes(dayOfWeek)) {
  return "⚠️ El artista no trabaja este día de la semana";
}
```

---

### 📊 Relación: `APPOINTMENTS` ↔ `ARTISTS.methodology`

```
┌─────────────────────┐
│   APPOINTMENTS      │
├─────────────────────┤
│ id                  │
│ artist_id           │──→ Busca artist.methodology
│ appointment_date    │──→ Valida contra working_days[]
│ duration_hours      │──→ Determina session_type (large/small)
│ session_type        │──→ Aplica reglas de large_session o small_session
│ status              │
└─────────────────────┘

VALIDACIONES:
✅ duration_hours > small_session.max_duration → session_type = 'large'
✅ session_type = 'large' + requires_full_day = true → Bloquea pequeñas
✅ Cuenta sesiones pequeñas existentes → Compara con max_per_day
✅ Verifica break_between_sessions_minutes entre small sessions
✅ appointment_date.getDay() debe estar en working_days[]
✅ appointment_time dentro de work_start_time - work_end_time
```

#### Ejemplo de Flujo de Agendamiento

**Escenario:** Cliente quiere agendar un tatuaje de 2 horas con un artista híbrido

```
1️⃣ Bot recibe solicitud: "Quiero una cita de 2 horas el martes"

2️⃣ Bot busca artist.methodology:
   {
     large_session: { duration_hours: 7, max_per_day: 1, requires_full_day: true },
     small_session: { max_duration_hours: 3, max_per_day: 3, break_minutes: 20 },
     working_days: [1, 2, 3, 4, 5]
   }

3️⃣ Bot determina tipo:
   2 horas < 3 horas → session_type = 'small' ✅

4️⃣ Bot verifica disponibilidad del martes (day=2):
   - ¿Está 2 en working_days? → Sí ✅
   - ¿Hay sesión grande ese día? → No ✅
   - ¿Cuántas sesiones pequeñas hay? → 1
   - ¿1 < 3 (max_per_day)? → Sí ✅
   - ¿Hay al menos 20 min de break con la sesión existente? → Sí ✅

5️⃣ Bot agenda:
   INSERT INTO appointments (
     artist_id, 
     appointment_date, 
     duration_hours: 2,
     session_type: 'small',
     status: 'scheduled'
   )

6️⃣ Bot responde:
   "✅ Agendado: Martes 15 de Enero, 2 horas (sesión pequeña)"
```

---

### 🎨 Casos de Uso Especiales

#### Caso 1: Artista Solo Proyectos Grandes
```json
{
  "large_session": { "max_per_day": 1, "requires_full_day": true },
  "small_session": { "max_per_day": 0 }
}
```
**Resultado:** Solo acepta 1 sesión grande al día, rechaza sesiones pequeñas

#### Caso 2: Artista Solo Tatuajes Rápidos
```json
{
  "large_session": { "max_per_day": 0 },
  "small_session": { "max_per_day": 5, "break_minutes": 15 }
}
```
**Resultado:** Solo acepta hasta 5 sesiones pequeñas al día, rechaza grandes

#### Caso 3: Artista Flexible (Puede Mezclar)
```json
{
  "large_session": { "max_per_day": 1, "requires_full_day": false },
  "small_session": { "max_per_day": 2 }
}
```
**Resultado:** Puede hacer 1 sesión grande + 2 pequeñas el mismo día

#### Caso 4: Artista Híbrido (No Mezcla)
```json
{
  "large_session": { "max_per_day": 1, "requires_full_day": true },
  "small_session": { "max_per_day": 4 }
}
```
**Resultado:** 1 sesión grande O 4 pequeñas, pero NO ambas el mismo día

---

### 🔧 Actualización de Metodología por el Artista

#### Ejemplo: Artista cambia sus días de trabajo

```
Artista: "Quiero trabajar solo Martes, Miércoles y Jueves"

Bot actualiza:
UPDATE artists 
SET methodology = jsonb_set(
  methodology, 
  '{working_days}', 
  '[2, 3, 4]'::jsonb
)
WHERE id = ?;

Bot confirma:
"✅ Actualizado. Ahora trabajarás únicamente Mar-Jue.
Las citas existentes fuera de estos días se mantienen,
pero no se aceptarán nuevas reservas en Lun, Vie, Sáb o Dom."
```

```typescript
// Pseudo-código del servicio de disponibilidad
function isTimeSlotAvailable(artistId, requestedDate, requestedTime) {
  const artist = await getArtist(artistId);
  const { methodology } = artist;
  
  // 1. Verificar si es día laboral
  const dayOfWeek = requestedDate.getDay();
  if (!methodology.working_days.includes(dayOfWeek)) {
    return { 
      available: false, 
      reason: "No trabajo ese día de la semana" 
    };
  }
  
  // 2. Verificar horario laboral
  if (requestedTime < methodology.work_start_time || 
      requestedTime > methodology.work_end_time) {
    return { 
      available: false, 
      reason: `Mi horario es de ${methodology.work_start_time} a ${methodology.work_end_time}` 
    };
  }
  
  // 3. Verificar límite diario
  const sessionsToday = await getSessionsOnDate(artistId, requestedDate);
  if (sessionsToday.length >= methodology.max_sessions_per_day) {
    return { 
      available: false, 
      reason: `Ya tengo ${methodology.max_sessions_per_day} sesiones ese día` 
    };
  }
  
  // 4. Verificar traslapes y breaks entre sesiones
  // ...
  
  return { available: true };
}
```

### 📝 Campo `rates` (JSONB) - Estructura de Tarifas

```typescript
rates: {
  hourly_rate: 200,              // Tarifa por hora (si cobra así)
  session_rate: 1200,            // Tarifa por sesión completa
  deposit_percentage: 30,        // % de depósito (30% = $360 si session es $1200)
  currency: "USD"                // Moneda
}

// Ejemplos:
// Solo sesiones:
{ "session_rate": 1500, "deposit_percentage": 25, "currency": "USD" }

// Solo por hora:
{ "hourly_rate": 250, "deposit_percentage": 20, "currency": "USD" }

// Híbrido:
{ "hourly_rate": 200, "session_rate": 1400, "deposit_percentage": 30, "currency": "MXN" }
```

### 🎨 Campo `style_preferences` (JSONB)

```typescript
style_preferences: {
  specialties: [
    "Neo-Japonés",
    "Blackwork",
    "Dotwork"
  ],
  refuses: [
    "Tatuajes menores de 10cm",
    "Letras pequeñas",
    "Nombres de parejas",
    "Copias exactas de otros artistas"
  ],
  portfolio_highlights: [
    "Dragones japoneses",
    "Mangas completas",
    "Obras grandes formato"
  ]
}
```

---

## Consideraciones de Escalabilidad

### Particionamiento por Fecha

```sql
-- Para tablas que crecen mucho
CREATE TABLE messages_2024 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE messages_2025 PARTITION OF messages
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Archivado de Conversaciones

```sql
-- Mover conversaciones inactivas >6 meses
CREATE TABLE conversations_archive (LIKE conversations INCLUDING ALL);

-- Trigger automático de archivado
CREATE OR REPLACE FUNCTION archive_old_conversations()
RETURNS void AS $$
BEGIN
  INSERT INTO conversations_archive
  SELECT * FROM conversations
  WHERE status = 'closed' 
    AND updated_at < NOW() - INTERVAL '6 months';
  
  DELETE FROM conversations
  WHERE status = 'closed' 
    AND updated_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;
```

### Compresión de Embeddings

```sql
-- Los embeddings ocupan espacio significativo
-- Considerar compresión o quantización para producción

-- Ejemplo: Reducir de VECTOR(768) a VECTOR(384)
-- Requiere re-entrenamiento de modelo o PCA
```

---

## Seguridad y Privacidad

### Row Level Security (RLS)

```sql
-- Solo el artista puede ver sus propios datos
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY artist_portfolio_policy ON portfolio_images
  FOR ALL
  USING (artist_id = current_user_id());

-- Clientes solo ven sus propias conversaciones
CREATE POLICY client_conversation_policy ON conversations
  FOR SELECT
  USING (client_id = current_user_id());
```

### Encriptación de Datos Sensibles

```sql
-- Números de teléfono encriptados
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encriptar al insertar
INSERT INTO clients (phone_number) 
VALUES (pgp_sym_encrypt('555-1234', 'encryption_key'));

-- Desencriptar al leer
SELECT pgp_sym_decrypt(phone_number::bytea, 'encryption_key') 
FROM clients;
```

---

## Migraciones

### Estrategia de Versionado

```
migrations/
  ├── 001_create_artists.sql
  ├── 002_create_clients.sql
  ├── 003_create_conversations.sql
  ├── 004_create_messages.sql
  ├── 005_create_projects.sql
  ├── 006_create_appointments.sql
  ├── 007_create_sessions.sql
  ├── 008_create_healing_checkpoints.sql
  ├── 009_create_portfolio_images.sql
  ├── 010_create_designs.sql
  ├── 011_create_payments.sql
  ├── 012_create_reference_images.sql ⭐
  ├── 013_add_client_ideas_to_conversations.sql ⭐
  ├── 012_create_gap_filler_queue.sql
  ├── 013_add_vector_extension.sql
  └── 014_create_search_cache.sql
```

### Herramientas Recomendadas

- **TypeORM Migrations** (para NestJS)
- **Prisma Migrate** (alternativa moderna)
- **Flyway** (para equipos grandes)

---

## 💬 Ejemplos de Conversación: Configuración del Artista

### 🎬 Escenario 1: Configuración Inicial (Onboarding)

**Cuando el tatuador activa Ghostline por primera vez:**

```


1. **Implementar esquema base** (tablas core: artists, clients, conversations, messages)
2. **Agregar extensión pgvector** para búsqueda semántica
3. **Crear índices optimizados** según queries más frecuentes
4. **Configurar RLS** para seguridad multi-tenant
5. **Setup de migraciones** automáticas con CI/CD
6. **Poblar data de prueba** para testing del bot
7. **Implementar tabla REFERENCE_IMAGES** para almacenar referencias del cliente ⭐
8. **Actualizar campo client_ideas** en CONVERSATIONS para historias personales ⭐

---

## 📋 Schema SQL: REFERENCE_IMAGES ⭐

```sql
CREATE TABLE reference_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Almacenamiento
  s3_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  whatsapp_media_id VARCHAR(255),
  
  -- Metadatos
  file_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  file_size_kb INTEGER,
  order_index SMALLINT NOT NULL CHECK (order_index BETWEEN 1 AND 6),
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(conversation_id, order_index)
);

-- Índices
CREATE INDEX idx_reference_conversation ON reference_images(conversation_id, order_index);
CREATE INDEX idx_reference_client ON reference_images(client_id, created_at DESC);
CREATE INDEX idx_reference_project ON reference_images(project_id) WHERE project_id IS NOT NULL;

-- Trigger para validar límite de 6 imágenes por conversación
CREATE OR REPLACE FUNCTION check_max_references()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM reference_images WHERE conversation_id = NEW.conversation_id) >= 6 THEN
    RAISE EXCEPTION 'Maximum 6 reference images per conversation exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_references
  BEFORE INSERT ON reference_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_references();
```

---

## Referencias

- [CHATBOT-FLOW.md](CHATBOT-FLOW.md) - Lógica de negocio y flujos conversacionales
- [LOGICA-TECNICA.md](LOGICA-TECNICA.md) - Implementación técnica detallada
- [STRUCTURE.md](STRUCTURE.md) - Estructura del código backend
- [README.md](README.md) - Overview general del proyecto
