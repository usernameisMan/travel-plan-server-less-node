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
export const extractUser = (req: Request, res: any, next: any) => {
  try {
    // The JWT payload is available in req.auth
    if (req.auth?.payload) {
      req.user = {
        sub: req.auth.payload.sub as string, // This is the user ID
        email: req.auth.payload.email as string,
        name: req.auth.payload.name as string,
        ...req.auth.payload
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
