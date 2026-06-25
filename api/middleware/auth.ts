import { auth } from "express-oauth2-jwt-bearer";
import { Request } from "express";

// Auth0 config
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || "dev-jm3p0fl7ukqun2o5.us.auth0.com",
  audience: process.env.AUTH0_AUDIENCE || "https://travel-plan-api",
};

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string; // Auth0 user ID
        email?: string;
        name?: string;
        [key: string]: any;
      };
    }
  }
}

// JWT verification middleware
export const checkJwt = auth({
  audience: "https://travel-plan-api",
  issuerBaseURL: "https://dev-jm3p0fl7ukqun2o5.us.auth0.com/",
  tokenSigningAlg: "RS256",
});

// Middleware to extract user information from JWT
export const extractUser = async (req: Request, res: any, next: any) => {
  try {
    if (req.auth?.payload) {
      const accessToken = req.headers.authorization?.split(" ")[1];
      let userInfo: { [key: string]: any } = {};

      try {
        const response = await fetch(
          "https://dev-jm3p0fl7ukqun2o5.us.auth0.com/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (response.ok) {
          userInfo = await response.json() as { [key: string]: any };
        }
      } catch (fetchError) {
        // Fall back to JWT claims only if userinfo fetch fails (cold start, rate limit, etc.)
        console.warn("Auth0 userinfo fetch failed, using JWT claims only:", fetchError);
      }

      req.user = {
        sub: req.auth.payload.sub as string,
        email: userInfo.email as string,
        nickname: userInfo.nickname as string,
        ...req.auth.payload,
        ...userInfo,
      };
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Error handling middleware
export const handleAuthError = (err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  next(err);
};
