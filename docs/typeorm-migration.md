# TypeORM 迁移文档

## 概述

项目已从 Drizzle ORM 迁移到 TypeORM，包括完整的实体定义、DTO 验证和数据库连接管理。

## 主要变更

### 1. 依赖更新

**移除的依赖:**
- `drizzle-orm`
- `@neondatabase/serverless`

**新增的依赖:**
- `typeorm` - ORM 框架
- `pg` - PostgreSQL 驱动
- `reflect-metadata` - 装饰器元数据支持
- `class-validator` - DTO 验证
- `class-transformer` - 数据转换

### 2. 项目结构

```
lib/
├── entities/          # TypeORM 实体
│   ├── Packet.ts
│   ├── ItineraryDay.ts
│   ├── Marker.ts
│   ├── Orders.ts
│   ├── PacketFavorites.ts
│   ├── PacketPurchase.ts
│   ├── PaymentLog.ts
│   ├── RefundLog.ts
│   ├── SellerPayout.ts
│   └── User.ts
├── dto/               # 数据传输对象
│   └── packet.dto.ts
└── data-source.ts     # TypeORM 数据源配置

api/
├── middleware/
│   ├── auth.ts
│   └── validation.ts  # 新增验证中间件
├── packets.ts         # 更新为使用 TypeORM
└── index.ts           # 更新为初始化 TypeORM
```

## 实体定义

### Packet 实体示例

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("packet")
export class Packet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column({ name: "user_id", type: "text", nullable: true })
  userId: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost: string;

  @Column({ name: "currency_code", type: "text", nullable: true, default: "USD" })
  currencyCode: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => ItineraryDay, (itineraryDay) => itineraryDay.packet)
  itineraryDays: ItineraryDay[];
}
```

## DTO 验证

### CreatePacketDto 示例

```typescript
import { IsString, IsOptional, IsNotEmpty, Length } from "class-validator";

export class CreatePacketDto {
  @IsNotEmpty({ message: "packet名称不能为空" })
  @IsString({ message: "packet名称必须是字符串" })
  @Length(1, 255, { message: "packet名称长度必须在1-255个字符之间" })
  name: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  @Length(0, 1000, { message: "描述长度不能超过1000个字符" })
  description?: string;

  @IsOptional()
  @IsString({ message: "费用必须是字符串格式的数字" })
  cost?: string;

  @IsOptional()
  @IsString({ message: "货币代码必须是字符串" })
  @Length(3, 3, { message: "货币代码必须是3个字符" })
  currencyCode?: string;
}
```

## 数据库操作

### 基本 CRUD 操作

```typescript
// 获取 Repository
const packetRepository = AppDataSource.getRepository(Packet);

// 查询所有
const packets = await packetRepository.find({
  where: { userId },
  order: { createdAt: 'DESC' }
});

// 查询单个
const packet = await packetRepository.findOne({
  where: { id: packetId, userId }
});

// 创建
const newPacket = packetRepository.create({
  name,
  userId,
  description,
  cost,
  currencyCode
});
const savedPacket = await packetRepository.save(newPacket);

// 更新
Object.assign(existingPacket, updateData);
const updatedPacket = await packetRepository.save(existingPacket);

// 删除
await packetRepository.remove(existingPacket);
```

## 验证中间件

### 使用验证中间件

```typescript
import { validationMiddleware } from './middleware/validation';
import { CreatePacketDto } from '../lib/dto/packet.dto';

// 在路由中使用
router.post('/', validationMiddleware(CreatePacketDto), async (req, res) => {
  // 请求体已经过验证
  const { name, description, cost, currencyCode } = req.body;
  // ... 处理逻辑
});
```

## 配置文件

### TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "strictPropertyInitialization": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true
  },
  "include": ["api/**/*", "lib/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 数据源配置 (lib/data-source.ts)

```typescript
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [Packet, ItineraryDay, /* ... 其他实体 */],
  migrations: ["lib/migrations/*.ts"],
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
```

## 安装和运行

### 安装依赖

```bash
pnpm install
```

### 运行项目

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 生产模式
pnpm start
```

## API 端点

所有原有的 API 端点保持不变，但现在使用 TypeORM 和 DTO 验证：

- `GET /api/packets` - 获取用户的所有 packets
- `GET /api/packets/:id` - 获取特定 packet
- `POST /api/packets` - 创建新 packet（带验证）
- `PUT /api/packets/:id` - 更新 packet（带验证）
- `DELETE /api/packets/:id` - 删除 packet

## 优势

### 相比 Drizzle ORM 的优势

1. **装饰器语法**: 更直观的实体定义
2. **关系映射**: 更强大的关联关系支持
3. **迁移系统**: 内置的数据库迁移功能
4. **验证集成**: 与 class-validator 无缝集成
5. **类型安全**: 完整的 TypeScript 支持
6. **活跃社区**: 更大的社区和更多资源

### 新增功能

1. **DTO 验证**: 自动验证请求数据
2. **标准化响应**: 统一的响应格式
3. **错误处理**: 更好的错误处理机制
4. **关系查询**: 支持复杂的关联查询

## 注意事项

1. **装饰器支持**: 确保 TypeScript 配置启用了装饰器
2. **reflect-metadata**: 必须在应用入口导入
3. **数据库同步**: 生产环境中设置 `synchronize: false`
4. **SSL 配置**: 生产环境中正确配置 SSL

## 迁移检查清单

- [x] 安装 TypeORM 相关依赖
- [x] 创建 TypeORM 实体
- [x] 创建 DTO 类
- [x] 更新数据库连接配置
- [x] 更新 API 路由使用 TypeORM
- [x] 添加验证中间件
- [x] 更新 TypeScript 配置
- [x] 测试所有 API 端点
- [x] 更新文档

项目现在完全使用 TypeORM，提供了更好的类型安全、验证和可维护性。 