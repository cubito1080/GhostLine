import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ProcessMessageDto } from './dto/process-message.dto';
import { AssistantResponseDto } from './dto/assistant-response.dto';

@Controller('assistant')
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  async processMessage(
    @Body() dto: ProcessMessageDto,
  ): Promise<AssistantResponseDto> {
    this.logger.log(
      `Processing message for conversation ${dto.conversationId}`,
    );
    return this.assistantService.processMessage(dto);
  }
}
