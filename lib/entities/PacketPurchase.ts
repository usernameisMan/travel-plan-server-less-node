import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("packet_purchase")
export class PacketPurchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", type: "text", nullable: true })
  userId: string;

  @Column({ name: "item_id", type: "text", nullable: true })
  itemId: string;

  @Column({ name: "item_type", type: "text", nullable: true })
  itemType: string;

  @Column({ name: "order_id", type: "integer", nullable: true })
  orderId: number;

  @Column({ name: "acquired_at", type: "timestamp with time zone", nullable: true })
  acquiredAt: Date;

  @Column({ type: "boolean", nullable: true })
  revoked: boolean;
} 