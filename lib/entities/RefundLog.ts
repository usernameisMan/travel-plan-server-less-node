import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("refund_log")
export class RefundLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "payment_log_id", type: "integer", nullable: true })
  paymentLogId: number;

  @Column({ name: "refund_amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  refundAmount: string;

  @Column({ name: "stripe_refund_id", type: "text", nullable: true })
  stripeRefundId: string;

  @Column({ name: "refunded_at", type: "timestamp with time zone", nullable: true })
  refundedAt: Date;

  @Column({ type: "text", nullable: true })
  status: string;
} 