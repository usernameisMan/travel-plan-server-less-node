# PlanPinGo — 后端项目总览

旅行计划 Web 应用 **PlanPinGo** 的 Express.js 后端，部署在 Vercel（serverless）。

对应前端：`../travel-plan/`（Next.js 14，App Router）

---

## 技术栈

| 依赖 | 说明 |
|------|------|
| Express.js 5 | HTTP 框架 |
| TypeORM 0.3 | ORM |
| PostgreSQL | 数据库（`pg` 驱动） |
| Auth0 JWT | `express-oauth2-jwt-bearer` 验证 token |
| class-validator | DTO 校验 |
| TypeScript 5 | |
| pnpm | 包管理器（不要用 npm/yarn） |
| Vercel | 部署平台（`vercel.json` 配置） |

---

## 目录结构

```
api/
├── index.ts              # 入口：Express app、中间件注册、路由挂载
├── packets.ts            # /api/packets 路由
├── shared.ts             # /api/shared 路由（公开，无需认证）
└── middleware/
    ├── auth.ts           # Auth0 checkJwt + extractUser + handleAuthError
    ├── logging.ts        # 请求/错误日志中间件
    └── validation.ts     # DTO 校验中间件

lib/
├── data-source.ts        # TypeORM DataSource 配置与初始化
├── entities/             # TypeORM 实体
└── dto/                  # Data Transfer Objects（class-validator）
```

---

## 数据库实体（`lib/entities/`）

| 实体 | 数据库表 | 说明 |
|------|----------|------|
| `Packet` | `packet` | 旅行计划主体 |
| `ItineraryDay` | — | 行程天数 |
| `Marker` | — | 地图标记点 |
| `User` | — | 用户信息 |
| `Orders` | — | 订单 |
| `PacketFavorites` | — | 收藏 |
| `PacketPurchase` | — | 购买记录 |
| `PacketShareAccess` | — | 分享访问权限 |
| `PaymentLog` | — | 支付日志 |
| `RefundLog` | — | 退款日志 |
| `SellerPayout` | — | 卖家结算 |

**Packet 分享字段**：`shareCode`（唯一）、`shareType`（`'private'`/`'free'`/`'paid'`）、`shareViews`、`shareEnabledAt`

实体字段命名：数据库列名用 snake_case，TypeScript 属性用 camelCase（TypeORM `@Column({ name: 'snake_case' })` 映射）。

---

## API 路由

```
公开路由（无需认证）：
  GET  /api/shared/:shareCode      # 访问公开分享的计划

认证路由（需 Bearer JWT）：
  GET    /api/packets              # 当前用户的计划列表
  POST   /api/packets              # 创建新计划
  GET    /api/packets/:id          # 计划详情
  PUT    /api/packets/:id          # 更新计划
  DELETE /api/packets/:id          # 删除计划
  POST   /api/packets/:id/share    # 启用分享（body: { shareType: 'free' | 'paid' }）
  DELETE /api/packets/:id/share    # 停止分享
  GET    /user/profile             # 当前用户信息
```

---

## 认证

- 中间件顺序：`checkJwt` → `extractUser` → `handleAuthError`
- 路由中取用户：`req.user?.sub`（Auth0 用户 ID）、`req.user?.email`
- `/api/shared` 路由在认证中间件之前注册，无需 token

---

## 环境变量（`.env`）

```env
AUTH0_AUDIENCE=
AUTH0_ISSUER_BASE_URL=
DATABASE_URL=          # PostgreSQL 连接串
```

---

## 开发命令

```bash
pnpm dev    # ts-node api/index.ts，端口 3000
pnpm build  # tsc 编译到 dist/
pnpm start  # node dist/api/index.js
```

---

## 注意事项

- 使用 **pnpm**，不要用 npm/yarn
- 新增实体后需在 `lib/data-source.ts` 的 `entities` 数组中注册
- DTO 校验通过 `api/middleware/validation.ts` 中的 `validateDto` 工具函数触发
- 分享功能：`shareType: 'free'` 已上线；`'paid'`（付费分享）接口预留但未完整实现
