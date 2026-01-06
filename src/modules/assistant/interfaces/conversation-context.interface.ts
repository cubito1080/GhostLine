export interface ConversationContext {
  conversationId: string;
  artistId: string;
  clientId: string;
  clientName: string;
  
  // Conversation history
  messages: ContextMessage[];
  
  // Artist profile data
  artistProfile: {
    name: string;
    styles: string[];
    minimumPrice: number;
    hourlyRate?: number;
    bookingAdvanceDays: number;
    workingHours: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };
  
  // Client state
  clientInfo?: {
    hasActiveBooking: boolean;
    lastInteractionDate: Date;
    previousTattoos?: number;
  };
  
  // Conversation state
  currentStage: 'greeting' | 'inquiry' | 'pricing' | 'booking' | 'payment' | 'confirmation';
  detectedIntent?: 'price_inquiry' | 'booking_request' | 'portfolio_view' | 'availability_check' | 'general_question' | 'objection' | 'unknown';
}

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
