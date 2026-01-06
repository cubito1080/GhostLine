export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash';
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

export interface GeminiResponse {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  tokensUsed: number;
}
