import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiConfig } from './interfaces/gemini-config.interface';
import { ToolDefinition } from './interfaces/tool-definition.interface';
import { GeminiMessage, FunctionCall } from './types';
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
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.initializeModel();
  }

  private initializeModel(modelName?: string, tools?: ToolDefinition[]) {
    const selectedModel = modelName || GEMINI_CONFIG.DEFAULT_MODEL;
    const generationConfig = selectedModel === GEMINI_MODELS.PRO ? PRO_CONFIG : FLASH_CONFIG;

    const modelConfig: any = {
      model: selectedModel,
      generationConfig,
      safetySettings: SAFETY_SETTINGS,
    };

    if (tools && tools.length > 0) {
      modelConfig.tools = [{
        functionDeclarations: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        })),
      }];
    }

    this.model = this.genAI.getGenerativeModel(modelConfig);
  }

  async generateResponse(
    messages: GeminiMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[],
    modelName?: string,
  ): Promise<{ response: string; functionCalls?: FunctionCall[] }> {
    try {
      // Reinitialize model with specified model name
      this.initializeModel(modelName, tools);

      const actualModel = modelName || GEMINI_CONFIG.DEFAULT_MODEL;
      this.logger.log(`Using model: ${actualModel}`);

      // Start chat with history
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'Entendido. Estoy listo para asistir a los clientes de Ghostline Tattoo.' }],
          },
          ...messages.slice(0, -1), // All messages except the last one
        ],
      });

      // Send the last message
      const lastMessage = messages[messages.length - 1];
      const lastMessageText = lastMessage.parts[0]?.text || '';
      const result = await chat.sendMessage(lastMessageText);
      const response = result.response;

      // Check for function calls
      const functionCalls: FunctionCall[] = [];
      const candidates = response.candidates || [];
      
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

      const textResponse = response.text();

      return {
        response: textResponse,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      };
    } catch (error) {
      this.logger.error('Error generating response from Gemini', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async sendFunctionResult(
    messages: GeminiMessage[],
    functionName: string,
    functionResult: any,
  ): Promise<string> {
    try {
      const chat = this.model.startChat({
        history: messages,
      });

      const result = await chat.sendMessage([
        {
          functionResponse: {
            name: functionName,
            response: functionResult,
          },
        },
      ]);

      return result.response.text();
    } catch (error) {
      this.logger.error('Error sending function result to Gemini', error);
      throw new Error('Failed to process function result');
    }
  }
}
