import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("seller_payout")
export class SellerPayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "seller_id", type: "text", nullable: true })
  sellerId: string;

  @Column({ name: "payment_log_id", type: "integer", nullable: true })
  paymentLogId: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  amount: string;

  @Column({ name: "stripe_transfer_id", type: "text", nullable: true })
  stripeTransferId: string;

  @Column({ name: "transferred_at", type: "timestamp with time zone", nullable: true })
  transferredAt: Date;

  @Column({ type: "text", nullable: true })
  status: string;
} 