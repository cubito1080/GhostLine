export type MessageRole = 'user' | 'assistant' | 'system';

export type ConversationStatus =
  | 'active'
  | 'waiting_payment'
  | 'waiting_confirmation'
  | 'completed'
  | 'cancelled';

export type ConversationStage =
  | 'greeting'
  | 'inquiry'
  | 'pricing'
  | 'booking'
  | 'payment'
  | 'confirmation';

export type DetectedIntent =
  | 'price_inquiry'
  | 'booking_request'
  | 'portfolio_view'
  | 'availability_check'
  | 'general_question'
  | 'objection'
  | 'unknown';

// Tipos de conversación para selección de modelo
export type ConversationType =
  | 'sales_persuasion'    // Requiere Gemini Pro: negociación, cierre de venta
  | 'simple_query';       // Usa Gemini Flash: info básica, consultas

export type ToolName =
  | 'check-availability'
  | 'calculate-pricing'
  | 'generate-payment-link'
  | 'search-portfolio'
  | 'schedule-appointment';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}
