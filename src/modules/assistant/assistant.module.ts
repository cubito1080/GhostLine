import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { GeminiService } from './gemini.service';
import { PromptManager } from './prompt.manager';
import { ContextBuilderService } from './context-builder.service';
import { ResponseGeneratorService } from './response-generator.service';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { Artist } from '../../database/entities/artist.entity';
import { Client } from '../../database/entities/client.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Conversation,
      Message,
      Artist,
      Client,
    ]),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    GeminiService,
    PromptManager,
    ContextBuilderService,
    ResponseGeneratorService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
