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
import { Artist } from './artist.entity';
import { Conversation } from './conversation.entity';
import { Project } from './project.entity';
import { Appointment } from './appointment.entity';
import { Payment } from './payment.entity';

@Entity('clients')
@Index(['artist_id', 'whatsapp_number'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  whatsapp_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['lead', 'prospect', 'active', 'completed', 'inactive'],
    default: 'lead',
  })
  @Index()
  status: 'lead' | 'prospect' | 'active' | 'completed' | 'inactive';

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    preferred_styles?: string[];
    body_placements?: string[];
    size_preferences?: string[];
    color_vs_blackwork?: string;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  preferred_language: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Artist, (artist) => artist.clients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;

  @OneToMany(() => Conversation, (conversation) => conversation.client)
  conversations: Conversation[];

  @OneToMany(() => Project, (project) => project.client)
  projects: Project[];

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments: Appointment[];

  @OneToMany(() => Payment, (payment) => payment.client)
  payments: Payment[];
}
