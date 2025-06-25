import { Request, Response, NextFunction } from 'express';

// List of sensitive fields, these field values will be replaced with [REDACTED]
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'authorization_code',
  'client_secret',
  'api_key',
  'secret',
  'private_key',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'social_security',
  'phone',
  'email',
  'address',
  'zip',
  'postal_code'
];

// Sensitive paths, request bodies for these paths will be completely hidden
const SENSITIVE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/token',
  '/auth/refresh',
  '/payment',
  '/webhook'
];

// Recursively filter sensitive information
function filterSensitiveData(obj: any, path: string = ''): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => filterSensitiveData(item, `${path}[${index}]`));
  }

  if (typeof obj === 'object') {
    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if it's a sensitive field
      if (SENSITIVE_FIELDS.some(field => 
        key.toLowerCase().includes(field.toLowerCase()) ||
        currentPath.toLowerCase().includes(field.toLowerCase())
      )) {
        filtered[key] = '[REDACTED]';
      } else {
        filtered[key] = filterSensitiveData(value, currentPath);
      }
    }
    return filtered;
  }

  return obj;
}

// Format request log
function formatRequestLog(req: Request): string {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  let body = null;
  if (req.body && Object.keys(req.body).length > 0) {
    // Check if it's a sensitive path
    if (SENSITIVE_PATHS.some(path => url.includes(path))) {
      body = '[SENSITIVE_PATH_REDACTED]';
    } else {
      body = filterSensitiveData(req.body);
    }
  }

  const headers = { ...req.headers };
  // Hide sensitive request headers
  if (headers.authorization) {
    headers.authorization = headers.authorization.startsWith('Bearer ') 
      ? 'Bearer [REDACTED]' 
      : '[REDACTED]';
  }

  return JSON.stringify({
    timestamp,
    type: 'REQUEST',
    method,
    url,
    ip,
    userAgent,
    headers: filterSensitiveData(headers),
    body,
    userId: req.user?.sub || 'unauthenticated'
  }, null, 2);
}

// Format response log
function formatResponseLog(req: Request, res: Response, responseBody: any, responseTime: number): string {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const statusCode = res.statusCode;
  
  // Filter sensitive information in response body
  let filteredBody = responseBody;
  if (responseBody && typeof responseBody === 'object') {
    filteredBody = filterSensitiveData(responseBody);
  }

  return JSON.stringify({
    timestamp,
    type: 'RESPONSE',
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    body: filteredBody,
    userId: req.user?.sub || 'unauthenticated'
  }, null, 2);
}

// Logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  console.log('🚀 REQUEST:', formatRequestLog(req));
  
  // Save original res.json method
  const originalJson = res.json;
  
  // Override res.json method to capture response body
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    console.log('📤 RESPONSE:', formatResponseLog(req, res, body, responseTime));
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  // Override res.send method to capture response body
  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Try to parse JSON response
    let parsedBody = body;
    try {
      if (typeof body === 'string') {
        parsedBody = JSON.parse(body);
      }
    } catch (e) {
      // If not JSON, keep as is
      parsedBody = body;
    }
    
    // Log response
    console.log('📤 RESPONSE:', formatResponseLog(req, res, parsedBody, responseTime));
    
    // Call original send method
    return originalSend.call(this, body);
  };
  
  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  
  console.error('❌ ERROR:', JSON.stringify({
    timestamp,
    type: 'ERROR',
    method,
    url,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : '[REDACTED]'
    },
    userId: req.user?.sub || 'unauthenticated'
  }, null, 2));
  
  next(err);
}; 