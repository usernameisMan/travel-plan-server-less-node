import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("orders")
export class Orders {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "order_number", type: "text", nullable: true })
  orderNumber: string;

  @Column({ name: "buyer_id", type: "text", nullable: true })
  buyerId: string;

  @Column({ name: "seller_id", type: "text", nullable: true })
  sellerId: string;

  @Column({ name: "item_id", type: "text", nullable: true })
  itemId: string;

  @Column({ name: "item_type", type: "text", nullable: true })
  itemType: string;

  @Column({ type: "integer", nullable: true })
  quantity: number;

  @Column({ name: "total_price", type: "decimal", precision: 10, scale: 2, nullable: true })
  totalPrice: string;

  @Column({ type: "text", nullable: true })
  status: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt: Date;
} 