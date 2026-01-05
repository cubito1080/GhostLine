import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
@Index(['conversation_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({
    type: 'enum',
    enum: ['user', 'assistant', 'system'],
  })
  role: 'user' | 'assistant' | 'system';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    whatsapp_message_id?: string;
    media_url?: string;
    media_type?: string;
    s3_key?: string;
    gemini_analysis?: any;
    function_call?: {
      name: string;
      arguments: any;
      result?: any;
    };
  };

  @Column({ type: 'int', nullable: true })
  token_count: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
