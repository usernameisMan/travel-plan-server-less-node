import 'dotenv/config';
import express from "express";
import { checkJwt, handleAuthError } from './middleware/auth';

const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 应用 Auth0 中间件到所有路由
app.use(checkJwt);
app.use(handleAuthError);

app.get("/", (req, res) => res.send("Express on Vercel !!!!!"));

app.listen(3000, () => console.log("Server ready on port 3000."));

export default app;
