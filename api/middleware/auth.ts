import { auth } from "express-oauth2-jwt-bearer";

// Auth0 config
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || "dev-jm3p0fl7ukqun2o5.us.auth0.com",
  audience: process.env.AUTH0_AUDIENCE || "https://travel-plan-api",
};

// JWT verification middleware
export const checkJwt = auth({
  audience: "https://travel-plan-api",
  issuerBaseURL: "https://dev-jm3p0fl7ukqun2o5.us.auth0.com/",
  tokenSigningAlg: "RS256",
});

// Error handling middleware
export const handleAuthError = (err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  next(err);
};
