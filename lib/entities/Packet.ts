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

  @Column({ name: "is_public", type: "boolean", nullable: true, default: false })
  isPublic: boolean;

  @Column({ name: "cover_img_url", type: "text", nullable: true })
  coverImgUrl: string;

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

  // Sharing fields
  @Column({ name: "share_code", type: "text", nullable: true, unique: true })
  shareCode: string;

  @Column({ name: "share_type", type: "text", nullable: true, default: "private" })
  shareType: string; // 'private', 'free', 'paid'

  @Column({ name: "share_enabled_at", type: "timestamp", nullable: true })
  shareEnabledAt: Date;

  @Column({ name: "share_views", type: "integer", nullable: true, default: 0 })
  shareViews: number;

  // Relationship - using string reference to avoid circular dependency
  @OneToMany("ItineraryDay", "packet")
  itineraryDays: any[];

  @OneToMany("Marker", "packet")
  markers: any[];

  @OneToMany("PacketFavorites", "packet")
  favorites: any[];

  @OneToMany("PacketShareAccess", "packet")
  shareAccess: any[];
} 