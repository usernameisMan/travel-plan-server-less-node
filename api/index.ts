import "reflect-metadata";
import "dotenv/config";
import express, { Express } from "express";
import { checkJwt, handleAuthError, extractUser } from "./middleware/auth";
import packetsRouter from "./packets";
import { initializeDatabase } from "../lib/data-source";

const app: Express = express();

// 初始化数据库连接
initializeDatabase().catch((error) => {
  console.error("数据库初始化失败:", error);
  process.exit(1);
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 应用 Auth0 中间件到所有路由
app.use(checkJwt);
app.use(extractUser); // 提取用户信息
app.use(handleAuthError);

app.get("/", (req, res) => res.send("Express on Vercel with TypeORM!"));

// 示例路由：展示如何获取用户ID
app.get("/user/profile", (req, res) => {
  // 现在可以通过 req.user 访问用户信息
  const userId = req.user?.sub;
  const userEmail = req.user?.email;
  const userName = req.user?.name;

  res.json({
    message: "用户信息获取成功",
    userId,
    userEmail,
    userName,
    fullUser: req.user,
  });
});

// 注册packets路由
app.use("/api/packets", packetsRouter);

app.listen(3000, () => console.log("Server ready on port 3000 with TypeORM."));

export default app;
