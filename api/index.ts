import 'dotenv/config';
import express from "express";
import { checkJwt, handleAuthError } from './middleware/auth';

const app = express();

// 应用 Auth0 中间件到所有路由
app.use(checkJwt);
app.use(handleAuthError);

app.get("/", (req, res) => res.send("Express on Vercel !!!!!"));

app.listen(3000, () => console.log("Server ready on port 3000."));

export default app;
