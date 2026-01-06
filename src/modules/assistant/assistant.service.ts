import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { PromptManager } from './prompt.manager';
import { ContextBuilderService } from './context-builder.service';
import { ResponseGeneratorService } from './response-generator.service';
import { ProcessMessageDto } from './dto/process-message.dto';
import { AssistantResponseDto } from './dto/assistant-response.dto';
import { GeminiMessage, ConversationType } from './types';
import { ToolDefinition } from './interfaces/tool-definition.interface';
import { GEMINI_MODELS } from './constants/gemini.constants';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly promptManager: PromptManager,
    private readonly contextBuilder: ContextBuilderService,
    private readonly responseGenerator: ResponseGeneratorService,
  ) {}

  async processMessage(dto: ProcessMessageDto): Promise<AssistantResponseDto> {
    try {
      // 1. Build conversation context
      this.logger.log(
        `Building context for conversation ${dto.conversationId}`,
      );
      const context = await this.contextBuilder.buildContext(
        dto.conversationId,
        dto.artistId,
        dto.clientId,
      );

      // 2. Generate system prompt
      const systemPrompt = this.promptManager.buildSystemPrompt(context);

      // 3. Convert context messages to Gemini format
      const geminiMessages: GeminiMessage[] = context.messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Add the new user message
      geminiMessages.push({
        role: 'user',
        parts: [{ text: dto.message }],
      });

      // 4. Get available tools
      const tools = this.getAvailableTools();

      // 5. Determine which model to use based on conversation context
      const conversationType = this.determineConversationType(dto.message, context);
      const modelToUse = conversationType === 'sales_persuasion' 
        ? GEMINI_MODELS.PRO 
        : GEMINI_MODELS.FLASH;
      
      this.logger.log(
        `Conversation type: ${conversationType}, Using model: ${modelToUse}`
      );

      // 6. Generate AI response
      this.logger.log('Generating AI response');
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      const { response, functionCalls } =
        await this.geminiService.generateResponse(
          geminiMessages,
          systemPrompt,
          tools,
          modelToUse,
        );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let finalResponse = response;
      const executedFunctions: string[] = [];

      // 6. Execute function calls if any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (functionCalls && functionCalls.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.log(`Executing ${functionCalls.length} function calls`);

        for (const functionCall of functionCalls) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result: any = this.executeFunctionCall(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              functionCall.name,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
              functionCall.args,
              context,
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            executedFunctions.push(functionCall.name);

            // Send function result back to Gemini
            /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            const followUpResponse =
              await this.geminiService.sendFunctionResult(
                geminiMessages,
                functionCall.name,
                result,
              );
            /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            finalResponse = followUpResponse;
          } catch (error) {
            this.logger.error(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              `Error executing function ${functionCall.name}`,
              error,
            );
          }
        }
      }

      // 7. Generate and save final response
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
      const assistantResponse =
        await this.responseGenerator.generateAndSaveResponse(
          dto.conversationId,
          finalResponse,
          context,
          executedFunctions,
        );

      return assistantResponse;
    } catch (error) {
      this.logger.error('Error processing message', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw error;
    }
  }

  private getAvailableTools(): ToolDefinition[] {
    return [
      {
        name: 'check-availability',
        description:
          'Verifica la disponibilidad del artista para una fecha específica',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Fecha solicitada en formato YYYY-MM-DD',
            },
            duration: {
              type: 'number',
              description: 'Duración estimada en horas',
            },
          },
          required: ['date'],
        },
      },
      {
        name: 'calculate-pricing',
        description:
          'Calcula el precio estimado de un tatuaje basado en sus características',
        parameters: {
          type: 'object',
          properties: {
            size: {
              type: 'string',
              description: 'Tamaño del tatuaje (pequeño, mediano, grande)',
              enum: ['pequeño', 'mediano', 'grande'],
            },
            complexity: {
              type: 'string',
              description:
                'Complejidad del diseño (simple, moderado, complejo)',
              enum: ['simple', 'moderado', 'complejo'],
            },
            estimatedHours: {
              type: 'number',
              description: 'Horas estimadas de trabajo',
            },
          },
          required: ['size', 'complexity'],
        },
      },
      {
        name: 'generate-payment-link',
        description: 'Genera un enlace de pago para el anticipo o pago total',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Monto en MXN',
            },
            description: {
              type: 'string',
              description: 'Descripción del pago',
            },
            isDeposit: {
              type: 'boolean',
              description: 'Si es un anticipo (true) o pago total (false)',
            },
          },
          required: ['amount', 'description'],
        },
      },
      {
        name: 'search-portfolio',
        description:
          'Busca imágenes del portafolio del artista según estilo o tipo',
        parameters: {
          type: 'object',
          properties: {
            style: {
              type: 'string',
              description: 'Estilo del tatuaje a buscar',
            },
            limit: {
              type: 'number',
              description: 'Número máximo de imágenes a retornar',
            },
          },
          required: [],
        },
      },
      {
        name: 'schedule-appointment',
        description:
          'Agenda una cita después de confirmar disponibilidad y pago',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Fecha de la cita en formato YYYY-MM-DD',
            },
            startTime: {
              type: 'string',
              description: 'Hora de inicio en formato HH:MM',
            },
            duration: {
              type: 'number',
              description: 'Duración en horas',
            },
            description: {
              type: 'string',
              description: 'Descripción del tatuaje',
            },
          },
          required: ['date', 'startTime', 'duration', 'description'],
        },
      },
    ];
  }

  private executeFunctionCall(
    functionName: string,
    args: Record<string, any>,
    context: any,
  ): any {
    this.logger.log(`Executing function: ${functionName} with args:`, args);

    // TODO: Implement actual function execution
    // For now, return mock responses

    switch (functionName) {
      case 'check-availability': {
        return {
          available: true,
          suggestedTimes: ['10:00', '14:00', '16:00'],
        };
      }

      case 'calculate-pricing': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const basePrice = context.artistProfile?.minimumPrice || 1000;
        const complexityMultiplier =
          args.complexity === 'simple'
            ? 1
            : args.complexity === 'moderado'
              ? 1.5
              : 2;
        const estimatedPrice = Math.round(basePrice * complexityMultiplier);

        return {
          estimatedPrice,
          priceRange: {
            min: Math.round(estimatedPrice * 0.9),
            max: Math.round(estimatedPrice * 1.2),
          },
        };
      }

      case 'generate-payment-link': {
        return {
          paymentLink: `https://pay.stripe.com/mock-link-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
      }

      case 'search-portfolio': {
        return {
          images: [
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { url: 'https://example.com/tattoo1.jpg', style: args.style },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { url: 'https://example.com/tattoo2.jpg', style: args.style },
          ],
        };
      }

      case 'schedule-appointment': {
        return {
          appointmentId: `apt-${Date.now()}`,
          confirmed: true,
          details: args,
        };
      }

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  /**
   * Determina qué modelo usar basándose en el contexto del mensaje
   * Pro: Para persuasión, negociación, cierre de ventas, manejo de objeciones
   * Flash: Para consultas simples, información general, saludos
   */
  private determineConversationType(
    message: string,
    context: any,
  ): ConversationType {
    const messageLower = message.toLowerCase();

    // Palabras clave que indican necesidad de persuasión (usar Pro)
    const salesKeywords = [
      'precio', 'caro', 'barato', 'descuento', 'oferta', 'cuánto',
      'no estoy seguro', 'pensándolo', 'dudas', 'no sé',
      'otro artista', 'comparar', 'cotizar',
      'pagar', 'anticipo', 'depósito', 'confirmar',
      'negociar', 'flexible', 'presupuesto limitado',
      'vale la pena', 'convencer', 'mejor opción',
    ];

    // Palabras clave para consultas simples (usar Flash)
    const simpleQueryKeywords = [
      'hola', 'buenas', 'gracias', 'adiós',
      'horario', 'ubicación', 'dirección', 'dónde',
      'portafolio', 'trabajos', 'diseños', 'ver',
      'disponibilidad', 'agenda', 'calendario',
      'cuánto tiempo', 'duración', 'cuánto tarda',
    ];

    // Verificar si el mensaje contiene keywords de ventas/persuasión
    const hasSalesIntent = salesKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // Verificar si el mensaje contiene keywords de consulta simple
    const hasSimpleQueryIntent = simpleQueryKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // Lógica de decisión basada en contexto de conversación
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (context.conversationStage === 'pricing' || context.conversationStage === 'payment') {
      return 'sales_persuasion'; // Etapa crítica de venta
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (context.conversationStage === 'confirmation' || context.conversationStage === 'booking') {
      return 'sales_persuasion'; // Cierre de venta
    }

    // Si detectamos intención de venta/negociación
    if (hasSalesIntent) {
      return 'sales_persuasion';
    }

    // Si es solo consulta simple y no hay señales de venta
    if (hasSimpleQueryIntent && !hasSalesIntent) {
      return 'simple_query';
    }

    // Por defecto, usar Flash para consultas generales (optimizar costos)
    return 'simple_query';
  }
}
