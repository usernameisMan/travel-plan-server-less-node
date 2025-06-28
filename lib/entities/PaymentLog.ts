import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("payment_log")
export class PaymentLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "order_id", type: "text", nullable: true })
  orderId: string;

  @Column({ name: "buyer_id", type: "text", nullable: true })
  buyerId: string;

  @Column({ name: "seller_id", type: "text", nullable: true })
  sellerId: string;

  @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  totalAmount: string;

  @Column({ name: "platform_fee", type: "decimal", precision: 10, scale: 2, nullable: true })
  platformFee: string;

  @Column({ name: "seller_amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  sellerAmount: string;

  @Column({ name: "stripe_payment_intent", type: "text", nullable: true })
  stripePaymentIntent: string;

  @Column({ name: "paid_at", type: "timestamp with time zone", nullable: true })
  paidAt: Date;

  @Column({ type: "text", nullable: true })
  status: string;
} 