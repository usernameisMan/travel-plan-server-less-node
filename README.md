# Travel Plan Server - TypeORM Edition

基于 TypeORM 的旅行计划服务器，提供用户认证和 packets 管理功能。

## 🚀 技术栈

- **框架**: Express.js + TypeScript
- **ORM**: TypeORM
- **数据库**: PostgreSQL
- **认证**: Auth0 JWT
- **验证**: class-validator + class-transformer
- **包管理**: pnpm

## 📁 项目结构

```
├── api/                    # API 路由
│   ├── middleware/         # 中间件
│   │   ├── auth.ts        # Auth0 认证中间件
│   │   └── validation.ts  # DTO 验证中间件
│   ├── packets.ts         # Packets API 路由
│   └── index.ts           # 应用入口
├── lib/                   # 核心库
│   ├── entities/          # TypeORM 实体
│   │   ├── Packet.ts
│   │   ├── ItineraryDay.ts
│   │   ├── Marker.ts
│   │   ├── Orders.ts
│   │   ├── PacketFavorites.ts
│   │   ├── PacketPurchase.ts
│   │   ├── PaymentLog.ts
│   │   ├── RefundLog.ts
│   │   ├── SellerPayout.ts
│   │   └── User.ts
│   ├── dto/               # 数据传输对象
│   │   └── packet.dto.ts
│   └── data-source.ts     # TypeORM 数据源配置
├── docs/                  # 文档
│   ├── packets-api.md     # Packets API 文档
│   ├── user-authentication.md # 用户认证文档
│   └── typeorm-migration.md   # TypeORM 迁移文档
└── dist/                  # 编译输出
```

## 🛠️ 安装和运行

### 环境要求

- Node.js 18+
- pnpm
- PostgreSQL 数据库

### 安装依赖

```bash
pnpm install
```

### 环境变量

创建 `.env` 文件：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=https://your-api-audience
NODE_ENV=development
```

### 运行项目

```bash
# 开发模式
pnpm dev

# 构建项目
pnpm build

# 生产模式
pnpm start
```

## 🔐 认证

项目使用 Auth0 进行用户认证。所有 API 请求都需要在请求头中包含有效的 JWT token：

```
Authorization: Bearer <your-jwt-token>
```

在路由处理函数中，可以通过 `req.user?.sub` 获取当前用户 ID：

```typescript
app.get('/api/some-route', (req, res) => {
  const userId = req.user?.sub; // 获取当前用户ID
  // ... 处理逻辑
});
```

## 📊 数据库

### 实体关系

- **Packet**: 旅行包主实体
- **ItineraryDay**: 行程日程
- **Marker**: 地图标记
- **User**: 用户信息
- **Orders**: 订单信息
- **PacketFavorites**: 收藏的旅行包
- **PacketPurchase**: 购买记录
- **PaymentLog**: 支付日志
- **RefundLog**: 退款日志
- **SellerPayout**: 卖家结算

### 数据库操作示例

```typescript
// 获取 Repository
const packetRepository = AppDataSource.getRepository(Packet);

// 查询用户的所有 packets
const packets = await packetRepository.find({
  where: { userId },
  order: { createdAt: 'DESC' }
});
```

## 🎯 API 端点

### Packets API

- `GET /api/packets` - 获取当前用户的所有 packets
- `GET /api/packets/:id` - 获取特定 packet 详情
- `POST /api/packets` - 创建新 packet
- `PUT /api/packets/:id` - 更新 packet
- `DELETE /api/packets/:id` - 删除 packet

### 用户信息

- `GET /user/profile` - 获取当前用户信息

## ✅ 数据验证

使用 DTO (Data Transfer Object) 进行请求数据验证：

```typescript
export class CreatePacketDto {
  @IsNotEmpty({ message: "packet名称不能为空" })
  @IsString({ message: "packet名称必须是字符串" })
  @Length(1, 255, { message: "packet名称长度必须在1-255个字符之间" })
  name: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;
}
```

## 🔧 开发

### 添加新实体

1. 在 `lib/entities/` 中创建实体文件
2. 在 `lib/data-source.ts` 中注册实体
3. 创建对应的 DTO 文件
4. 创建 API 路由

### 添加验证

使用 `class-validator` 装饰器为 DTO 添加验证规则：

```typescript
@IsEmail({}, { message: "邮箱格式不正确" })
@IsOptional()
email?: string;
```

## 📚 文档

- [Packets API 文档](docs/packets-api.md)
- [用户认证文档](docs/user-authentication.md)
- [TypeORM 迁移文档](docs/typeorm-migration.md)

## 🚀 部署

项目配置为 Vercel 部署：

```json
// vercel.json
{
  "builds": [{ "src": "api/index.ts", "use": "@vercel/node" }]
}
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## �� 许可证

ISC License
