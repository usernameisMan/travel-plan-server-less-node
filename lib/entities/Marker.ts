import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("marker")
export class Marker {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  title: string;

  @Column({ type: "text", nullable: true })
  lng: string;

  @Column({ type: "text", nullable: true })
  lat: string;

  @Column({ name: "packet_id", type: "text", nullable: true })
  packetId: string;
  
  @Column({ name: "user_id", type: "text", nullable: true })
  userId: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "day_id", type: "text", nullable: true })
  dayId: string;

  @Column({ type: "text", nullable: true })
  type: string;

  @Column({ name: "sort_order", type: "integer", nullable: true })
  sortOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  // Relationship - using string reference to avoid circular dependency
  @ManyToOne("Packet", "markers")
  @JoinColumn({ name: "packet_id" })
  packet: any;

  @ManyToOne("ItineraryDay", "markers")
  @JoinColumn({ name: "day_id" })
  day: any;
}
