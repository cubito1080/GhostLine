import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiMessage, FunctionCall } from './types';
import { ToolDefinition } from './interfaces/tool-definition.interface';
import { 
  GEMINI_MODELS, 
  GEMINI_CONFIG, 
  PRO_CONFIG, 
  FLASH_CONFIG, 
  SAFETY_SETTINGS 
} from './constants/gemini.constants';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1/models';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.logger.log(`Initializing Gemini with API Key: ${this.apiKey.substring(0, 10)}...`);
    this.logger.log(`Using API v1 with direct HTTP calls`);
  }

  async generateResponse(
    messages: GeminiMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[],
    modelName?: string,
  ): Promise<{ response: string; functionCalls?: FunctionCall[] }> {
    try {
      const selectedModel = modelName || GEMINI_CONFIG.DEFAULT_MODEL;
      const generationConfig = selectedModel === GEMINI_MODELS.PRO ? PRO_CONFIG : FLASH_CONFIG;

      this.logger.log(`Using model: ${selectedModel} via API v1`);

      // Build request body for v1 API
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido. Estoy listo para asistir a los clientes de Ghostline Tattoo.' }],
        },
        ...messages,
      ];

      const requestBody: any = {
        contents,
        generationConfig,
        safetySettings: SAFETY_SETTINGS.map(setting => ({
          category: `HARM_CATEGORY_${setting.category.replace('HARM_CATEGORY_', '')}`,
          threshold: setting.threshold,
        })),
      };

      if (tools && tools.length > 0) {
        requestBody.tools = [{
          functionDeclarations: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          })),
        }];
      }

      // Make HTTP POST request to v1 API
      const url = `${this.baseUrl}/${selectedModel}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Parse function calls
      const functionCalls: FunctionCall[] = [];
      const candidates = data.candidates || [];
      
      for (const candidate of candidates) {
        const content = candidate.content;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.functionCall) {
              functionCalls.push({
                name: part.functionCall.name,
                args: part.functionCall.args,
              });
            }
          }
        }
      }

      // Extract text response
      let textResponse = '';
      if (candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.text) {
            textResponse += part.text;
          }
        }
      }

      return {
        response: textResponse,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      };
    } catch (error) {
      this.logger.error('Error generating response from Gemini');
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Attempted model: ${modelName || GEMINI_CONFIG.DEFAULT_MODEL}`);
      
      throw new Error('Failed to generate AI response');
    }
  }

  async sendFunctionResult(
    messages: GeminiMessage[],
    functionName: string,
    functionResult: any,
  ): Promise<string> {
    try {
      // For function results, we need to continue the conversation
      // This is a simplified implementation - you may need to adjust based on your needs
      this.logger.log(`Sending function result for: ${functionName}`);
      
      return 'Function result processed';
    } catch (error) {
      this.logger.error('Error sending function result to Gemini', error);
      throw new Error('Failed to process function result');
    }
  }
}
