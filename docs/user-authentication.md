# 用户认证和获取用户ID

## 概述

本项目使用 Auth0 进行用户认证，通过 JWT token 验证用户身份。在请求处理函数中，你可以轻松获取当前用户的ID和其他信息。

## 设置

### 1. 中间件配置

项目已经配置了以下中间件：

- `checkJwt`: 验证 JWT token
- `extractUser`: 从 JWT 中提取用户信息并添加到 `req.user`
- `handleAuthError`: 处理认证错误

### 2. 类型定义

在 `api/middleware/auth.ts` 中扩展了 Express 的 Request 接口：

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string; // Auth0 用户ID
        email?: string;
        name?: string;
        [key: string]: any;
      };
    }
  }
}
```

## 使用方法

### 基本用法

在任何路由处理函数中，你可以通过 `req.user` 访问用户信息：

```typescript
app.get('/api/user/profile', (req, res) => {
  const userId = req.user?.sub; // 获取用户ID
  const userEmail = req.user?.email; // 获取用户邮箱
  const userName = req.user?.name; // 获取用户姓名
  
  res.json({
    userId,
    userEmail,
    userName
  });
});
```

### 常见使用场景

#### 1. 获取当前用户ID

```typescript
app.get('/api/me', (req, res) => {
  const userId = req.user?.sub;
  
  if (!userId) {
    return res.status(401).json({ message: '用户未认证' });
  }
  
  res.json({ userId });
});
```

#### 2. 创建用户相关数据

```typescript
app.post('/api/travel-plans', (req, res) => {
  const userId = req.user?.sub;
  const { title, destination } = req.body;
  
  if (!userId) {
    return res.status(401).json({ message: '用户未认证' });
  }
  
  // 创建与用户关联的数据
  const travelPlan = {
    id: Date.now().toString(),
    userId, // 关联到当前用户
    title,
    destination,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({ travelPlan });
});
```

#### 3. 获取用户的所有数据

```typescript
app.get('/api/travel-plans', (req, res) => {
  const userId = req.user?.sub;
  
  if (!userId) {
    return res.status(401).json({ message: '用户未认证' });
  }
  
  // 从数据库查询该用户的所有旅行计划
  // const userPlans = await db.travelPlans.findMany({ where: { userId } });
  
  res.json({ userId, plans: [] });
});
```

#### 4. 更新用户数据（确保权限）

```typescript
app.put('/api/travel-plans/:id', (req, res) => {
  const userId = req.user?.sub;
  const planId = req.params.id;
  
  if (!userId) {
    return res.status(401).json({ message: '用户未认证' });
  }
  
  // 验证该资源是否属于当前用户
  // const plan = await db.travelPlans.findFirst({ 
  //   where: { id: planId, userId } 
  // });
  
  // if (!plan) {
  //   return res.status(403).json({ message: '无权访问此资源' });
  // }
  
  // 更新数据
  res.json({ message: '更新成功', planId, userId });
});
```

#### 5. 自定义中间件验证资源所有权

```typescript
const verifyResourceOwnership = (req, res, next) => {
  const userId = req.user?.sub;
  const resourceId = req.params.id;
  
  if (!userId) {
    return res.status(401).json({ message: '用户未认证' });
  }
  
  // 验证资源所有权
  // const isOwner = await checkResourceOwnership(resourceId, userId);
  // if (!isOwner) {
  //   return res.status(403).json({ message: '无权访问此资源' });
  // }
  
  next();
};

app.get('/api/protected/:id', verifyResourceOwnership, (req, res) => {
  const userId = req.user?.sub;
  res.json({ message: '访问成功', userId });
});
```

## 用户信息字段

从 Auth0 JWT token 中提取的用户信息包含以下字段：

- `sub`: 用户唯一标识符（用户ID）
- `email`: 用户邮箱地址
- `name`: 用户姓名
- 其他 Auth0 配置的自定义字段

## 安全注意事项

1. **始终验证用户身份**: 在每个需要用户认证的路由中检查 `req.user?.sub`
2. **验证资源所有权**: 确保用户只能访问自己的数据
3. **使用 HTTPS**: 在生产环境中确保使用 HTTPS
4. **Token 过期处理**: Auth0 会自动处理 token 过期

## 错误处理

常见的认证错误：

- `401 Unauthorized`: 用户未认证或 token 无效
- `403 Forbidden`: 用户无权访问特定资源

## 测试

你可以使用以下端点测试用户认证：

- `GET /api/user/profile`: 获取当前用户信息
- `GET /api/user/data`: 创建用户相关数据示例

确保在请求头中包含有效的 Authorization token：

```
Authorization: Bearer <your-jwt-token>
``` 