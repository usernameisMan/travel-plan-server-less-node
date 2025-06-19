import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("user")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "family_name", type: "text", nullable: true })
  familyName: string;

  @Column({ type: "text", nullable: true })
  country: string;

  @Column({ type: "text", nullable: true })
  city: string;

  @Column({ type: "text", nullable: true })
  gender: string;

  @Column({ type: "text", nullable: true })
  age: string;

  @Column({ name: "auth0_id", type: "text", nullable: true })
  auth0Id: string;

  @Column({ name: "auth0_email", type: "text", nullable: true })
  auth0Email: string;

  @Column({ name: "auth0_login_connection", type: "text", nullable: true })
  auth0LoginConnection: string;

  @Column({ type: "text", nullable: true })
  email: string;

  @Column({ name: "given_name", type: "text", nullable: true })
  givenName: string;

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl: string;

  @Column({ name: "language_code", type: "text", nullable: true })
  languageCode: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;
} 