import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Client } from './client.entity';
import { Project } from './project.entity';

@Entity('reference_images')
@Index(['conversation_id', 'order_index'])
@Index(['client_id', 'created_at'])
export class ReferenceImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'uuid', nullable: true })
  project_id: string;

  // Storage
  @Column({ type: 'varchar', length: 500 })
  s3_url: string;

  @Column({ type: 'varchar', length: 500 })
  thumbnail_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  whatsapp_media_id: string;

  // Metadata
  @Column({ type: 'varchar', length: 50, default: 'image/jpeg' })
  file_type: string;

  @Column({ type: 'int', nullable: true })
  file_size_kb: number;

  @Column({ type: 'smallint' })
  order_index: number; // 1-6

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @BeforeInsert()
  validateOrderIndex() {
    if (this.order_index < 1 || this.order_index > 6) {
      throw new Error('order_index must be between 1 and 6');
    }
  }
}
