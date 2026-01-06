export class AssistantResponseDto {
  response: string;
  conversationId: string;
  timestamp: Date;
  metadata?: {
    functionCalls?: string[];
    detectedIntent?: string;
    conversationStage?: string;
    requiresAction?: boolean;
    actionType?: 'payment' | 'confirmation' | 'image_upload';
  };

  constructor(partial: Partial<AssistantResponseDto>) {
    Object.assign(this, partial);
    this.timestamp = partial.timestamp || new Date();
  }
}
