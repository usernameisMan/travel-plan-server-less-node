import { Request, Response, NextFunction } from 'express';

// 敏感字段列表，这些字段的值会被替换为 [REDACTED]
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

// 敏感路径，这些路径的请求体会被完全隐藏
const SENSITIVE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/token',
  '/auth/refresh',
  '/payment',
  '/webhook'
];

// 递归过滤敏感信息
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
      
      // 检查是否是敏感字段
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

// 格式化请求日志
function formatRequestLog(req: Request): string {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  let body = null;
  if (req.body && Object.keys(req.body).length > 0) {
    // 检查是否是敏感路径
    if (SENSITIVE_PATHS.some(path => url.includes(path))) {
      body = '[SENSITIVE_PATH_REDACTED]';
    } else {
      body = filterSensitiveData(req.body);
    }
  }

  const headers = { ...req.headers };
  // 隐藏敏感请求头
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

// 格式化响应日志
function formatResponseLog(req: Request, res: Response, responseBody: any, responseTime: number): string {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const statusCode = res.statusCode;
  
  // 过滤响应体中的敏感信息
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

// 日志中间件
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 记录请求
  console.log('🚀 REQUEST:', formatRequestLog(req));
  
  // 保存原始的 res.json 方法
  const originalJson = res.json;
  
  // 重写 res.json 方法来捕获响应体
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // 记录响应
    console.log('📤 RESPONSE:', formatResponseLog(req, res, body, responseTime));
    
    // 调用原始的 json 方法
    return originalJson.call(this, body);
  };
  
  // 重写 res.send 方法来捕获响应体
  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // 尝试解析 JSON 响应
    let parsedBody = body;
    try {
      if (typeof body === 'string') {
        parsedBody = JSON.parse(body);
      }
    } catch (e) {
      // 如果不是 JSON，保持原样
      parsedBody = body;
    }
    
    // 记录响应
    console.log('📤 RESPONSE:', formatResponseLog(req, res, parsedBody, responseTime));
    
    // 调用原始的 send 方法
    return originalSend.call(this, body);
  };
  
  next();
};

// 错误日志中间件
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