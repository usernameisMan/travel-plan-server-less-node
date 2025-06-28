# Packets API Documentation

## Overview

The Packets API provides complete CRUD operations for user travel packages (packets). All endpoints require user authentication.

## Authentication

All requests must include a valid JWT token in the request headers:

```
Authorization: Bearer your-jwt-token
```

## Endpoints

### 1. Get All Packets for Current User

**GET** `/api/packets`

Get all packets created by the current authenticated user.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tokyo Trip",
      "userId": "auth0|123456789",
      "description": "Amazing Tokyo travel plan",
      "cost": "1500.00",
      "currencyCode": "USD",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Packets retrieved successfully"
}
```

### 2. Get Specific Packet Details

**GET** `/api/packets/:id`

Get detailed information for a specific packet. Can only access packets belonging to the current user.

**Parameters:**
- `id` (path parameter): Packet ID

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tokyo Trip",
    "userId": "auth0|123456789",
    "description": "Amazing Tokyo travel plan",
    "cost": "1500.00",
    "currencyCode": "USD",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Packet details retrieved successfully"
}
```

### 3. Create New Packet

**POST** `/api/packets`

Create a new packet.

**Request Body:**
```json
{
  "name": "Paris Trip",
  "description": "Romantic Paris travel plan",
  "cost": "2000.00",
  "currencyCode": "USD"
}
```

**Required Fields:**
- `name`: Packet name

**Optional Fields:**
- `description`: Description
- `cost`: Cost
- `currencyCode`: Currency code (default: USD)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Paris Trip",
    "userId": "auth0|123456789",
    "description": "Romantic Paris travel plan",
    "cost": "2000.00",
    "currencyCode": "USD",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Packet created successfully"
}
```

### 4. Update Packet

**PUT** `/api/packets/:id`

Update an existing packet. Can only update packets belonging to the current user.

**Parameters:**
- `id` (path parameter): Packet ID

**Request Body:**
```json
{
  "name": "Updated Paris Trip",
  "description": "Updated description",
  "cost": "2500.00",
  "currencyCode": "EUR"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Updated Paris Trip",
    "userId": "auth0|123456789",
    "description": "Updated description",
    "cost": "2500.00",
    "currencyCode": "EUR",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Packet updated successfully"
}
```

### 5. Delete Packet

**DELETE** `/api/packets/:id`

Delete a packet. Can only delete packets belonging to the current user.

**Parameters:**
- `id` (path parameter): Packet ID

**Response Example:**
```json
{
  "success": true,
  "message": "Packet deleted successfully"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Packet name is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Packet not found or access denied"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### Using curl for Testing

```bash
# Get all packets
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/packets

# Create new packet
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Tokyo Trip", "description": "Amazing journey"}' \
     http://localhost:3000/api/packets

# Get specific packet
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/packets/1

# Update packet
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Tokyo Trip"}' \
     http://localhost:3000/api/packets/1

# Delete packet
curl -X DELETE \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/packets/1
```

### Using JavaScript/Fetch

```javascript
const token = 'YOUR_JWT_TOKEN';
const baseUrl = 'http://localhost:3000/api/packets';

// Get all packets
const getPackets = async () => {
  const response = await fetch(baseUrl, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Create new packet
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

// Usage example
getPackets().then(data => console.log(data));
createPacket({
  name: 'Tokyo Trip',
  description: 'Amazing journey',
  cost: '1500.00'
}).then(data => console.log(data));
```

## Important Notes

1. **User Isolation**: Each user can only access their own created packets
2. **Data Validation**: All inputs are validated
3. **Error Handling**: All operations have proper error handling
4. **Type Safety**: TypeScript ensures type safety
5. **Database Transactions**: All database operations are safe 