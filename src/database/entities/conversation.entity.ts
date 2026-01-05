import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from './client.entity';
import { Message } from './message.entity';
import { ReferenceImage } from './reference-image.entity';

@Entity('conversations')
@Index(['client_id', 'status'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({
    type: 'enum',
    enum: [
      'initial_contact',
      'diagnosis',
      'awaiting_deposit',
      'scheduled',
      'in_progress',
      'healing',
      'completed',
      'abandoned',
    ],
    default: 'initial_contact',
  })
  @Index()
  status:
    | 'initial_contact'
    | 'diagnosis'
    | 'awaiting_deposit'
    | 'scheduled'
    | 'in_progress'
    | 'healing'
    | 'completed'
    | 'abandoned';

  @Column({ type: 'jsonb', nullable: true })
  context: {
    extracted_variables?: {
      style?: string;
      body_part?: string;
      size?: string;
      color_preference?: string;
      budget?: number;
      urgency?: string;
    };
    last_intent?: string;
    awaiting_response_for?: string;
  };

  @Column({ type: 'text', nullable: true })
  client_ideas: string; // Historia personal y narrativa del cliente

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_bot_message_at: Date;

  @Column({ type: 'int', default: 0 })
  message_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Client, (client) => client.conversations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @OneToMany(() => ReferenceImage, (refImage) => refImage.conversation)
  reference_images: ReferenceImage[];
}
