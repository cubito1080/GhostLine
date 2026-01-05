// Shared enumerations

export enum ConversationStatus {
  INITIAL_CONTACT = 'initial_contact',
  GATHERING_INFO = 'gathering_info',
  QUALIFIED = 'qualified',
  AWAITING_DEPOSIT = 'awaiting_deposit',
  DEPOSITED = 'deposited',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum ClientStatus {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  INACTIVE = 'inactive',
}

export enum ProjectStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  FINAL_PAYMENT = 'final_payment',
  TIP = 'tip',
}

export enum CheckpointStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  ISSUE_DETECTED = 'issue_detected',
}

export enum GapFillerStatus {
  PENDING = 'pending',
  OFFERED = 'offered',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}
