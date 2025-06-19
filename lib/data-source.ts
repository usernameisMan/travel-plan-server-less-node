import "reflect-metadata";
import { DataSource } from "typeorm";
import { Packet } from "./entities/Packet";
import { ItineraryDay } from "./entities/ItineraryDay";
import { Marker } from "./entities/Marker";
import { Orders } from "./entities/Orders";
import { PacketFavorites } from "./entities/PacketFavorites";
import { PacketPurchase } from "./entities/PacketPurchase";
import { PaymentLog } from "./entities/PaymentLog";
import { RefundLog } from "./entities/RefundLog";
import { SellerPayout } from "./entities/SellerPayout";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // 在生产环境中设置为 false
  logging: process.env.NODE_ENV === "development",
  entities: [
    Packet,
    ItineraryDay,
    Marker,
    Orders,
    PacketFavorites,
    PacketPurchase,
    PaymentLog,
    RefundLog,
    SellerPayout,
    User,
  ],
  migrations: ["lib/migrations/*.ts"],
  subscribers: ["lib/subscribers/*.ts"],
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// 初始化数据源
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("数据库连接已初始化");
    }
  } catch (error) {
    console.error("数据库连接初始化失败:", error);
    throw error;
  }
}; 