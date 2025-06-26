import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

@Entity("itinerary_day")
export class ItineraryDay {
  @PrimaryColumn({ type: "text" })
  id: string;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column({ name: "packet_id", type: "text", nullable: true })
  packetId: string;

  @Column({ name: "day_number", type: "text", nullable: true })
  dayNumber: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "sort_order", type: "integer", nullable: true })
  sortOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  // Relationship - using string reference to avoid circular dependency
  @ManyToOne("Packet", "itineraryDays")
  @JoinColumn({ name: "packet_id" })
  packet: any;

  @OneToMany("Marker", "day")
  markers: any[];
}
