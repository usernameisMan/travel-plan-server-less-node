# Travel Plan Server

A travel plan server based on TypeORM, providing user authentication and packet management functionality.

## 🚀 Tech Stack

- **Framework**: Express.js + TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: Auth0 JWT
- **Validation**: class-validator + class-transformer
- **Package Manager**: pnpm

## 📁 Project Structure

```
travel-plan-server-less-node/
├── api/                    # API routes
│   ├── middleware/         # Middleware
│   │   ├── auth.ts        # Auth0 authentication middleware
│   │   └── validation.ts  # DTO validation middleware
│   ├── packets.ts         # Packets API routes
│   └── index.ts           # Application entry point
├── lib/                   # Core library
│   ├── entities/          # TypeORM entities
│   │   ├── Packet.ts
│   │   ├── ItineraryDay.ts
│   │   ├── Marker.ts
│   │   ├── User.ts
│   │   ├── Orders.ts
│   │   ├── PacketFavorites.ts
│   │   ├── PacketPurchase.ts
│   │   ├── PaymentLog.ts
│   │   ├── RefundLog.ts
│   │   └── SellerPayout.ts
│   ├── dto/               # Data Transfer Objects
│   │   ├── packet.dto.ts
│   │   └── itinerary.dto.ts
│   └── data-source.ts     # TypeORM data source configuration
├── docs/                  # Documentation
│   ├── packets-api.md     # Packets API documentation
│   ├── user-authentication.md # User authentication documentation
│   └── typeorm-migration.md   # TypeORM migration documentation
└── dist/                  # Build output
```

## 🛠️ Installation and Setup

### Prerequisites

- Node.js >= 16
- pnpm >= 8
- PostgreSQL database

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_ISSUER_BASE_URL=your-auth0-issuer-base-url
```

### Run the Project

```bash
# Development mode
pnpm dev

# Build project
pnpm build

# Production mode
pnpm start
```

## 🔐 Authentication

The project uses Auth0 for user authentication. All API requests must include a valid JWT token in the request headers:

```
Authorization: Bearer your-jwt-token
```

In route handler functions, you can get the current user ID via `req.user?.sub`:

```typescript
const userId = req.user?.sub; // Get current user ID
// ... processing logic
```

## 📊 Database

### Entity Relationships

- **Packet**: Main travel package entity
- **ItineraryDay**: Itinerary schedule
- **Marker**: Map markers
- **User**: User information
- **Orders**: Order information
- **PacketFavorites**: Favorite travel packages
- **PacketPurchase**: Purchase records
- **PaymentLog**: Payment logs
- **RefundLog**: Refund logs
- **SellerPayout**: Seller payouts

### Database Operation Examples

```typescript
// Get Repository
const packetRepository = AppDataSource.getRepository(Packet);

// Query all packets for a user
const userPackets = await packetRepository.find({
  where: { userId },
  order: { createdAt: "DESC" }
});
```

## 🎯 API Endpoints

### Travel Packages

- `GET /api/packets` - Get all packets for current user
- `GET /api/packets/:id` - Get specific packet details
- `POST /api/packets` - Create new packet
- `PUT /api/packets/:id` - Update packet
- `DELETE /api/packets/:id` - Delete packet

### User Information

- `GET /user/profile` - Get current user information

## ✅ Data Validation

Use DTO (Data Transfer Object) for request data validation:

```typescript
@IsNotEmpty({ message: "Packet name cannot be empty" })
@IsString({ message: "Packet name must be a string" })
@Length(1, 255, { message: "Packet name length must be between 1-255 characters" })
name: string;

@IsOptional()
@IsString({ message: "Description must be a string" })
description?: string;
```

## 🔧 Development

### Adding New Entities

1. Create entity file in `lib/entities/`
2. Register entity in `lib/data-source.ts`
3. Create corresponding DTO file
4. Create API routes

### Adding Validation

Use `class-validator` decorators to add validation rules to DTOs:

```typescript
@IsEmail({}, { message: "Invalid email format" })
email: string;
```

## 📚 Documentation

- [Packets API Documentation](docs/packets-api.md)
- [User Authentication Documentation](docs/user-authentication.md)
- [TypeORM Migration Documentation](docs/typeorm-migration.md)

## 🚀 Deployment

The project is configured for Vercel deployment:

1. Push code to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy automatically

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
