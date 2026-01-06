# 🚀 Guía Rápida: Configurar Gemini API para Probar Assistant Module

## 📋 Pasos para Obtener tu API Key de Google Gemini

### 1. **Ir a Google AI Studio**
- Abre tu navegador y ve a: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Inicia sesión con tu cuenta de Google

### 2. **Crear una API Key**
- Haz clic en el botón **"Create API key"** (Crear clave API)
- Selecciona un proyecto existente de Google Cloud o crea uno nuevo
- Copia la API key generada (formato: `AIza...`)

### 3. **Configurar en tu Proyecto**
- Abre el archivo `.env` en la raíz del proyecto
- Pega tu API key en la línea:
  ```env
  GEMINI_API_KEY=AIzaSyC...tu_clave_aqui
  ```
- **NO compartas esta clave** ni la subas a GitHub (ya está en `.gitignore`)

---

## ⚙️ Configuración de Base de Datos (Mínima)

Si tu base de datos PostgreSQL usa credenciales diferentes, actualiza estas líneas en `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario_postgres
DB_PASSWORD=tu_password_postgres
DB_NAME=ghostline_tattoo
```

---

## 🧪 Verificar que Todo Funciona

### 1. **Instalar dependencias** (si no lo has hecho):
```bash
npm install
```

### 2. **Ejecutar migraciones de base de datos**:
```bash
npm run migration:run
```

### 3. **Iniciar el servidor**:
```bash
npm run start:dev
```

Deberías ver en consola:
```
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Application listening on port 3000
```

Si ves un error como:
```
Error: GEMINI_API_KEY is not configured
```
Significa que no configuraste correctamente el `.env`.

---

## 🧪 Probar con Postman

### **Request de Ejemplo:**

**Método:** POST  
**URL:** `http://localhost:3000/assistant/chat`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "message": "Hola, ¿cuáles son tus horarios?",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "artistId": "550e8400-e29b-41d4-a716-446655440001",
  "clientId": "550e8400-e29b-41d4-a716-446655440002"
}
```

**⚠️ IMPORTANTE:** Los UUIDs deben existir en tu base de datos. Si no tienes datos de prueba, primero ejecuta seeds o crea registros manualmente.

---

## 📊 Casos de Prueba Sugeridos

### **1. Consulta Simple (usa Gemini Flash)**
```json
{
  "message": "¿Qué estilos de tatuajes haces?",
  "conversationId": "uuid-test-1",
  "artistId": "uuid-artist-1",
  "clientId": "uuid-client-1"
}
```
**Esperado:** Respuesta rápida sobre estilos del artista.

---

### **2. Consulta de Precio (usa Gemini Pro + Function Calling)**
```json
{
  "message": "¿Cuánto cuesta un tatuaje mediano en el brazo?",
  "conversationId": "uuid-test-1",
  "artistId": "uuid-artist-1",
  "clientId": "uuid-client-1"
}
```
**Esperado:** 
- IA llama a la función `calculate-pricing`
- Retorna precio estimado basado en mock data
- Logs muestran `sales_persuasion` y modelo `gemini-1.5-pro`

---

### **3. Consulta de Disponibilidad**
```json
{
  "message": "¿Tienes disponibilidad para el 15 de febrero?",
  "conversationId": "uuid-test-1",
  "artistId": "uuid-artist-1",
  "clientId": "uuid-client-1"
}
```
**Esperado:** 
- IA llama a `check-availability`
- Retorna horarios disponibles (mock)

---

## 🐛 Solución de Problemas Comunes

### **Error: "GEMINI_API_KEY is not configured"**
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Confirma que la variable `GEMINI_API_KEY` tiene un valor
- Reinicia el servidor (`npm run start:dev`)

### **Error: "Conversation not found"**
- Los UUIDs en el request no existen en la base de datos
- Ejecuta seeds o crea datos de prueba manualmente

### **Error: "Failed to generate AI response"**
- Verifica que tu API key de Gemini es válida
- Revisa que tienes acceso a internet
- Verifica cuota de API en Google AI Studio

### **Error de conexión a base de datos**
- Verifica credenciales en `.env` (DB_HOST, DB_PASSWORD, etc.)
- Asegúrate de que PostgreSQL está corriendo
- Ejecuta `npm run migration:run` para crear tablas

---

## 💡 Notas Importantes

1. **API Key Gratuita:** Google Gemini ofrece cuota gratuita generosa (15 requests/minuto para Flash, 2 requests/minuto para Pro).

2. **Modelos Híbridos:** El sistema elige automáticamente entre Pro (caro) y Flash (económico) basado en la intención del mensaje.

3. **Function Calls Mock:** Las herramientas (calculate-pricing, check-availability, etc.) retornan datos ficticios. No interactúan con DB real hasta que las implementes.

4. **Logs Útiles:** Revisa la consola del servidor para ver:
   - Tipo de conversación detectada
   - Modelo usado (Pro vs Flash)
   - Funciones ejecutadas

---

## 📚 Recursos Adicionales

- **Google AI Studio:** https://aistudio.google.com/
- **Documentación Gemini API:** https://ai.google.dev/docs
- **Límites de Cuota:** https://ai.google.dev/pricing

---

**¡Listo para probar!** 🚀 Ejecuta `npm run start:dev` y empieza a enviar requests desde Postman.
