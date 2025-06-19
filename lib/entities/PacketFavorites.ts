import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("packet_favorites")
export class PacketFavorites {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", type: "text", nullable: true })
  userId: string;

  @Column({ name: "packet_id", type: "text", nullable: true })
  packetId: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  // 关联关系 - 使用字符串引用避免循环依赖
  @ManyToOne("Packet", "favorites")
  @JoinColumn({ name: "packet_id" })
  packet: any;
} 