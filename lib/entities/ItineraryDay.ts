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

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  // 关联关系 - 使用字符串引用避免循环依赖
  @ManyToOne("Packet", "itineraryDays")
  @JoinColumn({ name: "packet_id" })
  packet: any;

  @OneToMany("Marker", "day")
  markers: any[];
} 