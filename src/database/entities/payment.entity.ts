import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from './client.entity';
import { Artist } from './artist.entity';

@Entity('payments')
@Index(['client_id', 'status'])
@Index(['artist_id', 'status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  stripe_payment_intent_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending',
  })
  @Index()
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';

  @Column({
    type: 'enum',
    enum: ['deposit', 'final_payment', 'tip'],
  })
  payment_type: 'deposit' | 'final_payment' | 'tip';

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    project_id?: string;
    session_id?: string;
    stripe_checkout_session_id?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Client, (client) => client.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Artist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;
}
