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
  url: "postgresql://neondb_owner:npg_TwHXdMoGNP60@ep-white-poetry-a88pnguq-pooler.eastus2.azure.neon.tech/travel-plan?sslmode=require",
  synchronize: false, // Set to false in production environment
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

// Initialize data source
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connection initialized successfully");
    }
  } catch (error) {
    console.error("Database connection initialization failed:", error);
    throw error;
  }
}; 