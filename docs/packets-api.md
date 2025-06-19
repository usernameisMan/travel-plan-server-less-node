# Packets API 文档

## 概述

Packets API 提供了对用户旅行包（packets）的完整CRUD操作。所有端点都需要用户认证。

## 认证

所有请求都需要在请求头中包含有效的 JWT token：

```
Authorization: Bearer <your-jwt-token>
```

## 端点

### 1. 获取当前用户的所有packets

**GET** `/api/packets`

获取当前认证用户创建的所有packets。

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "东京之旅",
      "userId": "auth0|123456789",
      "description": "精彩的东京旅行计划",
      "cost": "1500.00",
      "currencyCode": "USD",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "获取用户packets成功"
}
```

### 2. 获取特定packet详情

**GET** `/api/packets/:id`

获取特定packet的详细信息。只能获取属于当前用户的packet。

**参数：**
- `id` (路径参数): packet的ID

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "东京之旅",
    "userId": "auth0|123456789",
    "description": "精彩的东京旅行计划",
    "cost": "1500.00",
    "currencyCode": "USD",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "获取packet详情成功"
}
```

### 3. 创建新的packet

**POST** `/api/packets`

创建新的packet。

**请求体：**
```json
{
  "name": "巴黎之旅",
  "description": "浪漫的巴黎旅行计划",
  "cost": "2000.00",
  "currencyCode": "USD"
}
```

**必需字段：**
- `name`: packet名称

**可选字段：**
- `description`: 描述
- `cost`: 费用
- `currencyCode`: 货币代码（默认：USD）

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "巴黎之旅",
    "userId": "auth0|123456789",
    "description": "浪漫的巴黎旅行计划",
    "cost": "2000.00",
    "currencyCode": "USD",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "packet创建成功"
}
```

### 4. 更新packet

**PUT** `/api/packets/:id`

更新现有的packet。只能更新属于当前用户的packet。

**参数：**
- `id` (路径参数): packet的ID

**请求体：**
```json
{
  "name": "更新后的巴黎之旅",
  "description": "更新后的描述",
  "cost": "2500.00",
  "currencyCode": "EUR"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "更新后的巴黎之旅",
    "userId": "auth0|123456789",
    "description": "更新后的描述",
    "cost": "2500.00",
    "currencyCode": "EUR",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "packet更新成功"
}
```

### 5. 删除packet

**DELETE** `/api/packets/:id`

删除packet。只能删除属于当前用户的packet。

**参数：**
- `id` (路径参数): packet的ID

**响应示例：**
```json
{
  "success": true,
  "message": "packet删除成功"
}
```

## 错误响应

### 401 Unauthorized
```json
{
  "success": false,
  "message": "用户未认证"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "packet名称是必需的"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "packet不存在或无权限访问"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "服务器内部错误"
}
```

## 使用示例

### 使用 curl 测试

```bash
# 获取所有packets
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/packets

# 创建新packet
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "东京之旅", "description": "精彩旅程"}' \
     http://localhost:3000/api/packets

# 获取特定packet
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/packets/1

# 更新packet
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "更新后的东京之旅"}' \
     http://localhost:3000/api/packets/1

# 删除packet
curl -X DELETE \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/packets/1
```

### 使用 JavaScript/Fetch

```javascript
const token = 'YOUR_JWT_TOKEN';
const baseUrl = 'http://localhost:3000/api/packets';

// 获取所有packets
const getPackets = async () => {
  const response = await fetch(baseUrl, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// 创建新packet
const createPacket = async (packetData) => {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(packetData)
  });
  return response.json();
};

// 使用示例
getPackets().then(data => console.log(data));
createPacket({
  name: '东京之旅',
  description: '精彩旅程',
  cost: '1500.00'
}).then(data => console.log(data));
```

## 注意事项

1. **用户隔离**: 每个用户只能访问自己创建的packets
2. **数据验证**: 所有输入都会进行验证
3. **错误处理**: 所有操作都有适当的错误处理
4. **类型安全**: 使用TypeScript确保类型安全
5. **数据库事务**: 所有数据库操作都是安全的 