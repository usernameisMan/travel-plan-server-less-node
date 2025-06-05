import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Auth0 config
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || 'dev-jm3p0fl7ukqun2o5.us.auth0.com',
  audience: process.env.AUTH0_AUDIENCE || 'https://dev-jm3p0fl7ukqun2o5.us.auth0.com/api/v2/',
};

// JWT verification middleware
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`
  }),
  audience: auth0Config.audience,
  issuer: `https://${auth0Config.domain}/`,
  algorithms: ['RS256']
});

// Error handling middleware
export const handleAuthError = (err: any, req: any, res: any, next: any) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  next(err);
}; 