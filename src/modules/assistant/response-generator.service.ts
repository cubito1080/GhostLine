import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../database/entities/message.entity';
import { Conversation } from '../../database/entities/conversation.entity';
import { AssistantResponseDto } from './dto/assistant-response.dto';
import { ConversationContext } from './interfaces/conversation-context.interface';

@Injectable()
export class ResponseGeneratorService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async generateAndSaveResponse(
    conversationId: string,
    aiResponse: string,
    context: ConversationContext,
    functionCalls?: string[],
  ): Promise<AssistantResponseDto> {
    // Save AI response to database
    const message = this.messageRepo.create({
      conversation_id: conversationId,
      content: aiResponse,
      role: 'assistant',
      metadata: {
        gemini_analysis: {
          detectedIntent: context.detectedIntent,
          conversationStage: context.currentStage,
          functionCalls,
        },
      },
    });

    await this.messageRepo.save(message);

    // Update conversation status if needed
    await this.updateConversationStatus(conversationId, context);

    // Determine if action is required
    const requiresAction = this.checkIfActionRequired(aiResponse, context);
    const actionType = this.determineActionType(aiResponse, context);

    return new AssistantResponseDto({
      response: aiResponse,
      conversationId,
      timestamp: new Date(),
      metadata: {
        functionCalls,
        detectedIntent: context.detectedIntent,
        conversationStage: context.currentStage,
        requiresAction,
        actionType,
      },
    });
  }

  private async updateConversationStatus(
    conversationId: string,
    context: ConversationContext,
  ): Promise<void> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) return;

    // Update status based on stage
    if (context.currentStage === 'payment') {
      conversation.status = 'awaiting_deposit';
    } else if (context.currentStage === 'booking') {
      conversation.status = 'scheduled';
    } else if (context.currentStage === 'confirmation') {
      conversation.status = 'scheduled';
    } else {
      conversation.status = 'diagnosis';
    }

    await this.conversationRepo.save(conversation);
  }

  private checkIfActionRequired(response: string, context: ConversationContext): boolean {
    const lowerResponse = response.toLowerCase();
    
    // Check if response contains action indicators
    if (lowerResponse.includes('enlace de pago') || lowerResponse.includes('link de pago')) {
      return true;
    }
    if (lowerResponse.includes('confirmar') && context.currentStage === 'booking') {
      return true;
    }
    if (lowerResponse.includes('envía') && lowerResponse.includes('imagen')) {
      return true;
    }

    return false;
  }

  private determineActionType(
    response: string,
    context: ConversationContext,
  ): 'payment' | 'confirmation' | 'image_upload' | undefined {
    const lowerResponse = response.toLowerCase();

    if (lowerResponse.includes('enlace de pago') || lowerResponse.includes('link de pago')) {
      return 'payment';
    }
    if (lowerResponse.includes('confirmar') && context.currentStage === 'booking') {
      return 'confirmation';
    }
    if (lowerResponse.includes('envía') && lowerResponse.includes('imagen')) {
      return 'image_upload';
    }

    return undefined;
  }

  formatResponseWithImages(response: string, imageUrls: string[]): string {
    if (imageUrls.length === 0) return response;

    const imagesSection = imageUrls
      .map((url, index) => `\n${index + 1}. ${url}`)
      .join('');

    return `${response}\n\n📷 Imágenes:${imagesSection}`;
  }
}
