import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("packet")
export class Packet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column({ name: "user_id", type: "text", nullable: true })
  userId: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost: string;

  @Column({ name: "currency_code", type: "text", nullable: true, default: "USD" })
  currencyCode: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  // 关联关系 - 使用字符串引用避免循环依赖
  @OneToMany("ItineraryDay", "packet")
  itineraryDays: any[];

  @OneToMany("Marker", "packet")
  markers: any[];

  @OneToMany("PacketFavorites", "packet")
  favorites: any[];
} 