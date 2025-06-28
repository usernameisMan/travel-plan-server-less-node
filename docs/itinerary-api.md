# 行程数据 API 文档

## 🎯 概述

新增的行程数据 API 支持创建和获取包含完整行程信息的 packets，完美支持你的前端数据结构。

## 📊 数据结构映射

### 前端 → 数据库映射

```javascript
// 前端数据结构
[
  {
    "day": "Day 1",           // → ItineraryDay.dayNumber
    "dayText": "第1天",       // → ItineraryDay.name  
    "description": "",        // → ItineraryDay.description
    "tracks": [               // → Marker 表
      {
        "type": "star",       // → Marker.type
        "location": {
          "lng": "104.00038", // → Marker.lon
          "lat": "30.613771"  // → Marker.lat
        },
        "title": "1",         // → Marker.title
        "description": "2"    // → Marker.description
      }
    ]
  }
]
```

## 🔗 API 端点

### 1. 创建带行程的 Packet

**POST** `/api/packets/with-itinerary`

**请求体格式:**
```json
{
  "name": "成都3日游",
  "description": "精彩的成都旅行计划", 
  "cost": "1500.00",
  "currencyCode": "CNY",
  "itinerary": [你的前端数据结构]
}
```

**完整示例:**
```json
{
  "name": "成都3日游",
  "description": "精彩的成都旅行计划",
  "cost": "1500.00", 
  "currencyCode": "CNY",
  "itinerary": [
    {
      "day": "Day 1",
      "dayText": "第1天",
      "description": "",
      "tracks": [
        {
          "type": "star",
          "location": {
            "lng": "104.00038193898553",
            "lat": "30.613771626296227"
          },
          "title": "春熙路",
          "description": "成都最繁华的商业街"
        },
        {
          "type": "hospital", 
          "location": {
            "lng": "104.06526993947529",
            "lat": "30.52479424304309"
          },
          "title": "华西医院",
          "description": "知名医院"
        }
      ]
    },
    {
      "day": "Day 2", 
      "dayText": "第2天",
      "description": "",
      "tracks": [
        {
          "type": "favorite",
          "location": {
            "lng": "104.06587974220088",
            "lat": "30.524830274684476"
          },
          "title": "武侯祠",
          "description": "三国文化圣地"
        }
      ]
    }
  ]
}
```

### 2. 获取带完整行程的 Packet

**GET** `/api/packets/:id/with-itinerary`

获取指定 packet 的完整信息，包括所有行程和标记点。

## 🛠️ 使用示例

### 前端调用示例

```javascript
// 你的前端数据
const frontendData = [
  {
    "day": "Day 1",
    "dayText": "第1天", 
    "description": "",
    "tracks": [
      {
        "type": "star",
        "location": {
          "lng": "104.00038193898553",
          "lat": "30.613771626296227"
        },
        "title": "1",
        "description": "2"
      }
      // ... 更多 tracks
    ]
  }
  // ... 更多天数
];

// 创建 packet
const createPacket = async () => {
  const response = await fetch('/api/packets/with-itinerary', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "我的旅行计划",
      description: "精彩旅程", 
      cost: "1500.00",
      currencyCode: "CNY",
      itinerary: frontendData  // 直接使用你的前端数据
    })
  });
  
  const result = await response.json();
  console.log('创建成功:', result);
};
```

### curl 测试示例

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试行程",
    "description": "测试描述",
    "itinerary": [
      {
        "day": "Day 1",
        "dayText": "第1天",
        "description": "",
        "tracks": [
          {
            "type": "star",
            "location": {"lng": "104.00038", "lat": "30.613771"},
            "title": "地点1",
            "description": "描述1"
          }
        ]
      }
    ]
  }' \
  http://localhost:3000/api/packets/with-itinerary
```

## ✅ 数据验证

### 必需字段
- `name`: packet 名称
- `itinerary`: 行程数据数组
- `day`: 天数标识
- `dayText`: 天数显示文本  
- `tracks`: 地点数组
- `type`: 标记类型
- `location.lng`: 经度
- `location.lat`: 纬度
- `title`: 标题

### 可选字段
- `description`: 描述信息
- `cost`: 费用
- `currencyCode`: 货币代码

## 🔄 数据处理流程

1. **接收前端数据** → 验证 DTO
2. **开始数据库事务** → 确保数据一致性
3. **创建 Packet** → 获取 packet ID
4. **遍历 itinerary 数组**:
   - 为每天创建 `ItineraryDay` 记录
   - 为每个 track 创建 `Marker` 记录
5. **提交事务** → 返回完整数据

## 🎯 响应格式

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "成都3日游",
    "userId": "auth0|123456789",
    "description": "精彩的成都旅行计划",
    "cost": "1500.00",
    "currencyCode": "CNY",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "itineraryDays": [
      {
        "id": "uuid-1",
        "name": "第1天",
        "packetId": "1", 
        "dayNumber": "Day 1",
        "description": "",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "markers": [
          {
            "id": "uuid-marker-1",
            "title": "1",
            "lon": "104.00038193898553",
            "lat": "30.613771626296227", 
            "packetId": "1",
            "userId": "auth0|123456789",
            "description": "2",
            "dayId": "uuid-1",
            "type": "star",
            "sortOrder": 1,
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ]
  },
  "message": "packet和行程创建成功"
}
```

## 🚀 核心特性

- ✅ **完美支持你的数据结构**: 直接使用前端数据，无需转换
- ✅ **事务安全**: 确保数据完整性，要么全部成功要么全部回滚
- ✅ **用户隔离**: 所有数据都与当前用户关联
- ✅ **排序保持**: 保持前端传入的 tracks 顺序
- ✅ **完整验证**: TypeScript + DTO 双重类型安全
- ✅ **关联完整**: 正确建立 Packet → ItineraryDay → Marker 关系

你现在可以直接使用 `POST /api/packets/with-itinerary` 来保存你的前端数据到数据库了！ 