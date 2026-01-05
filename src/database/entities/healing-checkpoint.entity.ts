import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Session } from './session.entity';
import { PortfolioImage } from './portfolio-image.entity';

@Entity('healing_checkpoints')
@Index(['session_id', 'checkpoint_day'])
export class HealingCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'int' })
  checkpoint_day: number; // 7, 14, 21

  @Column({ type: 'timestamp' })
  @Index()
  scheduled_at: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'reminder_sent', 'photo_received', 'completed', 'missed'],
    default: 'pending',
  })
  @Index()
  status:
    | 'pending'
    | 'reminder_sent'
    | 'photo_received'
    | 'completed'
    | 'missed';

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_s3_key: string;

  @Column({ type: 'jsonb', nullable: true })
  gemini_assessment: {
    healing_quality?: string;
    concerns_detected?: string[];
    recommendation?: string;
  };

  @Column({ type: 'text', nullable: true })
  client_feedback: string;

  @Column({ type: 'uuid', nullable: true })
  portfolio_image_id: string;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Session, (session) => session.healing_checkpoints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @OneToOne(() => PortfolioImage, { nullable: true })
  @JoinColumn({ name: 'portfolio_image_id' })
  portfolio_image: PortfolioImage;
}
