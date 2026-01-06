# Assistant Module - Gemini AI Integration

El **Assistant Module** es el cerebro del chatbot de Ghostline. Integra Google Gemini AI para generar respuestas inteligentes, manejar conversaciones contextuales y ejecutar herramientas mediante function calling.

## 🎯 Propósito

Este módulo orquesta toda la inteligencia artificial del chatbot:
- Procesa mensajes de clientes con contexto completo
- Genera respuestas naturales y profesionales usando Gemini AI
- Ejecuta herramientas (function calling) para acciones específicas
- Mantiene el estado de la conversación
- Detecta intenciones del cliente (pricing, booking, portfolio, etc.)

## 🏗️ Arquitectura

```
Mensaje del Cliente
    ↓
ContextBuilderService → Carga historial, perfil artista, info cliente
    ↓
PromptManager → Construye sistema prompt con contexto
    ↓
GeminiService → Genera respuesta con Gemini AI
    ↓
[Si hay function calls] → Ejecuta herramientas (check-availability, calculate-pricing, etc.)
    ↓
ResponseGeneratorService → Formatea y guarda respuesta
    ↓
AssistantController → Retorna al cliente
```

## 📁 Estructura del Módulo

```
assistant/
├── assistant.module.ts              # Configuración del módulo
├── assistant.service.ts             # Orquestador principal
├── assistant.controller.ts          # REST API para testing
│
├── gemini.service.ts               # Integración con Gemini AI
├── prompt.manager.ts               # Construcción de prompts
├── context-builder.service.ts      # Construcción de contexto
├── response-generator.service.ts   # Formateo y guardado de respuestas
│
├── tools/                          # Function calling tools
│   ├── check-availability.tool.ts  # Verificar disponibilidad de fechas
│   ├── calculate-pricing.tool.ts   # Calcular precios estimados
│   ├── generate-payment-link.tool.ts # Generar enlaces de pago Stripe
│   ├── search-portfolio.tool.ts    # Búsqueda semántica de portfolio
│   └── schedule-appointment.tool.ts # Agendar citas
│
├── interfaces/
│   ├── gemini-config.interface.ts  # Configuración de Gemini
│   ├── tool-definition.interface.ts # Definición de herramientas
│   └── conversation-context.interface.ts # Contexto de conversación
│
├── dto/
│   ├── process-message.dto.ts      # Input: mensaje a procesar
│   └── assistant-response.dto.ts   # Output: respuesta generada
│
├── constants/
│   ├── prompts.constants.ts        # Templates de prompts
│   └── gemini.constants.ts         # Configuraciones de Gemini
│
├── types/
│   └── index.ts                    # Tipos TypeScript
│
└── README.md                       # Esta documentación
```

## 🔧 Servicios Principales

### 1. **AssistantService**
Orquestador principal que coordina todos los componentes.

```typescript
async processMessage(dto: ProcessMessageDto): Promise<AssistantResponseDto>
```

**Responsabilidades:**
- Recibe mensaje del cliente
- Coordina construcción de contexto
- Llama a Gemini AI
- Ejecuta function calls si es necesario
- Retorna respuesta formateada

---

### 2. **ContextBuilderService**
Construye el contexto completo de la conversación.

```typescript
async buildContext(conversationId: string, artistId: string, clientId: string): Promise<ConversationContext>
```

**Responsabilidades:**
- Carga historial de mensajes (últimos 10)
- Obtiene perfil del artista (precios, horarios, estilos)
- Obtiene información del cliente
- Detecta etapa de conversación (greeting, pricing, booking, etc.)
- Detecta intención del mensaje (price_inquiry, booking_request, etc.)

**Contexto generado:**
```typescript
{
  conversationId: string,
  artistId: string,
  clientId: string,
  clientName: string,
  messages: ContextMessage[],
  artistProfile: {
    name: string,
    styles: string[],
    minimumPrice: number,
    hourlyRate: number,
    bookingAdvanceDays: number,
    workingHours: WorkingHour[]
  },
  currentStage: 'greeting' | 'inquiry' | 'pricing' | 'booking' | 'payment' | 'confirmation',
  detectedIntent: 'price_inquiry' | 'booking_request' | 'portfolio_view' | ...
}
```

---

### 3. **PromptManager**
Construye prompts dinámicos basados en el contexto.

**Métodos:**
```typescript
buildSystemPrompt(context: ConversationContext): string
buildPriceInquiryPrompt(details, context): string
buildBookingPrompt(details): string
buildObjectionHandlingPrompt(objection, context): string
buildPortfolioRequestPrompt(requestedStyle, tattooType): string
```

**Ejemplo de prompt generado:**
```
Eres un asistente virtual profesional de "Ghostline Tattoo".

INFORMACIÓN DEL ARTISTA:
Nombre: Mateo Ramírez
Estilos: Neo-traditional, Black & Grey, Realism
Precio mínimo: $1500 MXN
Tarifa por hora: $2000 MXN/hora
Horarios: Lunes-Viernes: 10:00 - 18:00

CAPACIDADES:
1. Consultar disponibilidad de fechas
2. Calcular precios estimados
3. Mostrar portafolio del artista
4. Generar enlaces de pago
5. Agendar citas
```

---

### 4. **GeminiService**
Integración directa con Google Gemini AI.

```typescript
async generateResponse(
  messages: GeminiMessage[],
  systemPrompt: string,
  tools?: ToolDefinition[]
): Promise<{ response: string; functionCalls?: FunctionCall[] }>
```

**Responsabilidades:**
- Inicializa modelo Gemini con configuración
- Envía mensajes con historial de conversación
- Detecta function calls en la respuesta
- Procesa resultados de function calls
- Retorna respuesta final

**Configuración:**
```typescript
{
  model: 'gemini-1.5-pro',      // Para persuasión/ventas
  model: 'gemini-1.5-flash',    // Para consultas simples
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.95,
  topK: 40,
  enableFunctionCalling: true
}
```

**⚡ Estrategia de Modelos Híbridos:**
El módulo implementa un sistema inteligente que alterna entre **Gemini Pro** y **Gemini Flash** para optimizar costos sin sacrificar calidad:

- **Gemini 1.5 Pro** (Alta calidad, mayor costo):
  - Negociación de precios y manejo de objeciones
  - Cierre de ventas y confirmación de pagos
  - Persuasión y conversaciones complejas
  - Etapas: `pricing`, `payment`, `booking`, `confirmation`
  
- **Gemini 1.5 Flash** (Rápido, económico):
  - Saludos y despedidas
  - Información general (horarios, ubicación)
  - Consultas de portafolio
  - Verificación de disponibilidad básica

**Ahorro estimado:** ~40% en costos de API manteniendo calidad en conversaciones críticas.

---

### 5. **ResponseGeneratorService**
Formatea respuestas y actualiza base de datos.

```typescript
async generateAndSaveResponse(
  conversationId: string,
  aiResponse: string,
  context: ConversationContext,
  functionCalls?: string[]
): Promise<AssistantResponseDto>
```

**Responsabilidades:**
- Guarda mensaje de AI en base de datos
- Actualiza estado de conversación
- Detecta si requiere acción del usuario (pago, confirmación, etc.)
- Formatea respuestas con imágenes
- Retorna DTO con metadata

---

## 🛠️ Function Calling Tools

El módulo incluye 5 herramientas que Gemini AI puede invocar:

### 1. **check-availability**
Verifica disponibilidad de fechas del artista.

**Input:**
```json
{
  "requestedDate": "2026-02-15",
  "duration": 4
}
```

**Output:**
```json
{
  "available": true,
  "alternativeDates": ["2026-02-16", "2026-02-17"]
}
```

---

### 2. **calculate-pricing**
Calcula precio estimado de tatuaje.

**Input:**
```json
{
  "size": "medium",
  "style": "neo-traditional",
  "complexity": "medium",
  "estimatedHours": 3
}
```

**Output:**
```json
{
  "estimatedPrice": 6000,
  "priceRange": { "min": 5000, "max": 7000 },
  "deposit": 1800
}
```

---

### 3. **generate-payment-link**
Genera enlace de pago Stripe.

**Input:**
```json
{
  "amount": 1800,
  "description": "Anticipo - Tatuaje Neo-traditional",
  "clientId": "uuid"
}
```

**Output:**
```json
{
  "paymentUrl": "https://checkout.stripe.com/...",
  "expiresAt": "2026-01-13T10:00:00Z"
}
```

---

### 4. **search-portfolio**
Búsqueda semántica en portfolio usando pgvector.

**Input:**
```json
{
  "query": "dragons neo-japanese style",
  "style": "neo-traditional",
  "limit": 5
}
```

**Output:**
```json
{
  "images": [
    {
      "url": "https://s3.amazonaws.com/...",
      "description": "Neo-traditional dragon sleeve",
      "tags": ["dragon", "neo-traditional", "sleeve"]
    }
  ]
}
```

---

### 5. **schedule-appointment**
Agenda cita en calendario.

**Input:**
```json
{
  "date": "2026-02-15",
  "duration": 4,
  "projectId": "uuid",
  "notes": "Primera sesión - Diseño de dragon"
}
```

**Output:**
```json
{
  "appointmentId": "uuid",
  "googleCalendarEventId": "event123",
  "confirmed": true
}
```

---

## 📊 Flujo de Conversación

### Ejemplo: Cliente pregunta por precio

```
1. Cliente: "¿Cuánto cuesta un tatuaje de 10cm en el brazo?"

2. ContextBuilder:
   - Carga historial (vacío, es primer mensaje)
   - Obtiene perfil del artista (Mateo, $1500 mínimo, $2000/hora)
   - Detecta etapa: 'pricing'
   - Detecta intención: 'price_inquiry'

3. PromptManager:
   - Construye sistema prompt con info del artista
   - Añade template de pricing inquiry

4. GeminiService:
   - Envía prompt + mensaje a Gemini
   - Gemini decide invocar: calculate-pricing
   
5. Function Call Execution:
   - calculate-pricing({ size: "small", estimatedHours: 1 })
   - Retorna: { estimatedPrice: 2000, priceRange: { min: 1500, max: 2500 } }

6. GeminiService (segunda vuelta):
   - Recibe resultado de función
   - Genera respuesta final en lenguaje natural

7. ResponseGenerator:
   - Guarda mensaje en BD
   - Actualiza conversación a etapa 'pricing'
   - Retorna respuesta formateada

8. Respuesta al cliente:
   "Para un tatuaje de 10cm en el brazo, el precio estimado es de $2,000 MXN. 
   Puede variar entre $1,500 y $2,500 dependiendo de la complejidad del diseño.
   ¿Te gustaría ver algunos ejemplos de mi trabajo?"
```

---

## 🔌 REST API (Testing)

### POST `/assistant/chat`

Procesa un mensaje y retorna respuesta del AI.

**Request:**
```json
{
  "message": "¿Cuánto cuesta un tatuaje de dragon en el brazo?",
  "conversationId": "uuid",
  "artistId": "uuid",
  "clientId": "uuid",
  "clientName": "Juan Pérez"
}
```

**Response:**
```json
{
  "response": "Para un tatuaje de dragon en el brazo, necesito más detalles...",
  "conversationId": "uuid",
  "timestamp": "2026-01-06T10:30:00Z",
  "metadata": {
    "functionCalls": ["calculate-pricing"],
    "detectedIntent": "price_inquiry",
    "conversationStage": "pricing",
    "requiresAction": false
  }
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### Constantes de Configuración

**Gemini Config** (`constants/gemini.constants.ts`):
```typescript
// Modelos disponibles
GEMINI_MODELS = {
  PRO: 'gemini-1.5-pro',      // Persuasión y ventas
  FLASH: 'gemini-1.5-flash'   // Consultas simples
}

// Configuración Pro (mayor creatividad para persuasión)
PRO_CONFIG = {
  temperature: 0.8,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 3072
}

// Configuración Flash (más preciso y directo)
FLASH_CONFIG = {
  temperature: 0.5,
  topP: 0.85,
  topK: 30,
  maxOutputTokens: 1024
}

MAX_HISTORY_MESSAGES: 10
ENABLE_FUNCTION_CALLING: true
```

**Lógica de Selección de Modelo:**

El sistema analiza automáticamente cada mensaje para determinar el modelo óptimo:

```typescript
// Palabras clave que activan Gemini Pro (ventas/persuasión):
- 'precio', 'caro', 'descuento', 'pagar', 'negociar'
- 'no estoy seguro', 'pensándolo', 'otro artista'

// Palabras clave que usan Gemini Flash (consultas simples):
- 'hola', 'horario', 'ubicación', 'portafolio'
- 'disponibilidad', 'cuánto tiempo', 'dónde'

// Etapas que fuerzan Gemini Pro:
- conversationStage === 'pricing' || 'payment' || 'booking'
```

---

## 🧪 Testing

```bash
# Test individual con curl
curl -X POST http://localhost:3000/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, quiero un tatuaje",
    "conversationId": "test-conv-id",
    "artistId": "test-artist-id",
    "clientId": "test-client-id"
  }'
```

---

## 🚀 Mejoras Futuras

- [ ] Soporte para múltiples idiomas
- [ ] Análisis de sentimiento del cliente
- [ ] Detección de objeciones y manejo automático
- [ ] A/B testing de diferentes prompts
- [ ] Caché de respuestas frecuentes en Redis
- [ ] Streaming de respuestas en tiempo real
- [ ] Integración con WhatsApp Business API
- [ ] Analytics de conversión por etapa
- [ ] Dashboard de métricas de uso de modelos Pro vs Flash
- [ ] Sistema de rate limiting por usuario

---

## 💰 Optimización de Costos

### Comparativa de Uso (ejemplo conversación típica 10 msgs)

| Escenario                 | Costo Estimado | Ahorro |
|---------------------------|----------------|--------|
| Solo Gemini Pro           | $0.030         | -      |
| **Sistema Híbrido**       | **$0.018**     | **40%**|
| Solo Gemini Flash         | $0.010         | ⚠️ Baja calidad en ventas |

**Distribución recomendada:**
- 60% Flash (consultas generales)
- 40% Pro (negociación y cierre)

**Métricas a monitorear:**
1. % de mensajes por modelo
2. Tasa de conversión por modelo usado
3. Costo promedio por lead convertido
4. Tiempo de respuesta promedio

---

## 📚 Referencias

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Function Calling Guide](https://ai.google.dev/docs/function_calling)
- [NestJS Documentation](https://docs.nestjs.com)

---

**Última actualización:** Enero 6, 2026
