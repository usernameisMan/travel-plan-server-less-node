import "reflect-metadata";
import "dotenv/config";
import express, { Express } from "express";
import { checkJwt, handleAuthError, extractUser } from "./middleware/auth";
import { requestLoggingMiddleware, errorLoggingMiddleware } from "./middleware/logging";
import packetsRouter from "./packets";
import sharedRouter from "./shared";
import { initializeDatabase } from "../lib/data-source";

const app: Express = express();

// Initialize database connection
initializeDatabase().catch((error) => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - must be before other middleware
app.use(requestLoggingMiddleware);

// CORS configuration
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.get("/", (req, res) => res.send("Express on Vercel with TypeORM!"));

// Register shared routes (no authentication required)
app.use("/api/shared", sharedRouter);

// Apply Auth0 middleware to authenticated routes
app.use(checkJwt);
app.use(extractUser); // Extract user information
app.use(handleAuthError);

// Example route: demonstrate how to get user ID
app.get("/user/profile", (req, res) => {
  // Now you can access user information through req.user
  const userId = req.user?.sub;
  const userEmail = req.user?.email;
  const userName = req.user?.name;

  res.json({
    message: "User information retrieved successfully",
    userId,
    userEmail,
    userName,
    fullUser: req.user,
  });
});

// Register packets routes (authentication required)
app.use("/api/packets", packetsRouter);

// Error logging middleware - must be after all routes
app.use(errorLoggingMiddleware);

app.listen(3000, () => console.log("Server ready on port 3000 with TypeORM."));

export default app;
