import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Packet } from "./Packet";

@Entity("packet_share_access")
export class PacketShareAccess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "packet_id", type: "integer" })
  packetId: number;

  @Column({ name: "share_code", type: "text" })
  shareCode: string;

  @Column({ name: "visitor_ip", type: "inet", nullable: true })
  visitorIp: string;

  @Column({ name: "visitor_user_id", type: "text", nullable: true })
  visitorUserId: string;

  @Column({ name: "access_type", type: "text", nullable: true })
  accessType: string; // 'view', 'purchase'

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: "accessed_at", type: "timestamp" })
  accessedAt: Date;

  // Relationship
  @ManyToOne("Packet", "shareAccess")
  @JoinColumn({ name: "packet_id" })
  packet: Packet;
}