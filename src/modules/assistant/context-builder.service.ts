import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { Artist } from '../../database/entities/artist.entity';
import { Client } from '../../database/entities/client.entity';
import {
  ConversationContext,
  ContextMessage,
} from './interfaces/conversation-context.interface';

@Injectable()
export class ContextBuilderService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Artist)
    private readonly artistRepo: Repository<Artist>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async buildContext(
    conversationId: string,
    artistId: string,
    clientId: string,
  ): Promise<ConversationContext> {
    // Fetch conversation
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Fetch messages (limited to recent history)
    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { created_at: 'DESC' },
      take: 10, // GEMINI_CONFIG.MAX_HISTORY_MESSAGES
    });

    // Fetch artist profile with working hours
    const artist = await this.artistRepo.findOne({
      where: { id: artistId },
    });

    if (!artist) {
      throw new Error('Artist not found');
    }

    // Fetch client info
    const client = await this.clientRepo.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Build context messages
    const contextMessages: ContextMessage[] = messages
      .reverse() // Oldest first
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.created_at,
        metadata: (msg.metadata as Record<string, any>) || {},
      }));

    // Determine conversation stage and intent
    const currentStage = this.detectConversationStage(contextMessages);
    const detectedIntent = this.detectIntent(
      contextMessages[contextMessages.length - 1]?.content || '',
    );

    // Extract working hours from methodology
    const workingDays = artist.methodology?.working_days || [1, 2, 3, 4, 5];
    const workStartTime = artist.methodology?.work_start_time || '09:00';
    const workEndTime = artist.methodology?.work_end_time || '18:00';

    const workingHours = workingDays.map((day) => ({
      dayOfWeek: day,
      startTime: workStartTime,
      endTime: workEndTime,
    }));

    return {
      conversationId,
      artistId,
      clientId,
      clientName: client.name,
      messages: contextMessages,
      artistProfile: {
        name: artist.name,
        styles: artist.style_preferences?.specialties || [],
        minimumPrice: artist.rates?.deposit_percentage ? 500 : 1000, // TODO: Get actual minimum
        hourlyRate: artist.rates?.hourly_rate || 0,
        bookingAdvanceDays: artist.methodology?.advance_booking_days || 7,
        workingHours,
      },
      clientInfo: {
        hasActiveBooking: false, // TODO: Check for active bookings
        lastInteractionDate: new Date(),
        previousTattoos: 0, // TODO: Count previous appointments
      },
      currentStage,
      detectedIntent,
    };
  }

  private detectConversationStage(
    messages: ContextMessage[],
  ): ConversationContext['currentStage'] {
    if (messages.length === 0) return 'greeting';

    const lastMessages = messages.slice(-3).map((m) => m.content.toLowerCase());
    const conversationText = lastMessages.join(' ');

    if (
      conversationText.includes('pago') ||
      conversationText.includes('anticipo')
    ) {
      return 'payment';
    }
    if (
      conversationText.includes('agendar') ||
      conversationText.includes('cita') ||
      conversationText.includes('disponibilidad')
    ) {
      return 'booking';
    }
    if (
      conversationText.includes('precio') ||
      conversationText.includes('costo') ||
      conversationText.includes('cuánto')
    ) {
      return 'pricing';
    }
    if (
      conversationText.includes('confirmar') ||
      conversationText.includes('confirmación')
    ) {
      return 'confirmation';
    }
    if (messages.length <= 2) {
      return 'greeting';
    }

    return 'inquiry';
  }

  private detectIntent(
    lastMessage: string,
  ): ConversationContext['detectedIntent'] {
    const lowerMessage = lastMessage.toLowerCase();

    if (
      lowerMessage.includes('precio') ||
      lowerMessage.includes('costo') ||
      lowerMessage.includes('cuánto')
    ) {
      return 'price_inquiry';
    }
    if (
      lowerMessage.includes('agendar') ||
      lowerMessage.includes('cita') ||
      lowerMessage.includes('reservar')
    ) {
      return 'booking_request';
    }
    if (
      lowerMessage.includes('portafolio') ||
      lowerMessage.includes('trabajos') ||
      lowerMessage.includes('ver diseños')
    ) {
      return 'portfolio_view';
    }
    if (
      lowerMessage.includes('disponibilidad') ||
      lowerMessage.includes('disponible') ||
      lowerMessage.includes('cuándo')
    ) {
      return 'availability_check';
    }
    if (
      lowerMessage.includes('no') &&
      (lowerMessage.includes('pero') || lowerMessage.includes('sin embargo'))
    ) {
      return 'objection';
    }

    return 'general_question';
  }
}
