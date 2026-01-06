// Configuración de modelos híbridos para optimización de costos
export const GEMINI_MODELS = {
  PRO: 'gemini-1.5-pro',      // Para persuasión, cierre de ventas, negociación
  FLASH: 'gemini-1.5-flash',  // Para consultas simples, información general
};

export const GEMINI_CONFIG = {
  DEFAULT_MODEL: GEMINI_MODELS.FLASH, // Por defecto usar el más económico
  MAX_HISTORY_MESSAGES: 10,
  ENABLE_FUNCTION_CALLING: true,
};

// Configuración específica para Gemini Pro (persuasión y ventas)
export const PRO_CONFIG = {
  temperature: 0.8,  // Más creativo para persuasión natural
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 3072,
};

// Configuración específica para Gemini Flash (consultas simples)
export const FLASH_CONFIG = {
  temperature: 0.5,  // Más preciso y directo para info básica
  topP: 0.85,
  topK: 30,
  maxOutputTokens: 1024,
};

// Para compatibilidad con código existente
export const GENERATION_CONFIG = FLASH_CONFIG;

export const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];
