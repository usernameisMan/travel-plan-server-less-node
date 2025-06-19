import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AppDataSource } from '../lib/data-source';
import { Packet } from '../lib/entities/Packet';
import { ItineraryDay } from '../lib/entities/ItineraryDay';
import { Marker } from '../lib/entities/Marker';
import { 
  CreatePacketDto, 
  UpdatePacketDto, 
  PacketListResponseDto, 
  PacketSingleResponseDto, 
  PacketErrorResponseDto 
} from '../lib/dto/packet.dto';
import {
  CreatePacketWithItineraryDto,
  PacketWithItineraryResponseDto
} from '../lib/dto/itinerary.dto';
import { validationMiddleware } from './middleware/validation';
import { v4 as uuidv4 } from 'uuid';

const router: ExpressRouter = Router();

// GET /api/packets - 获取当前用户的所有packets
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    
    // 从数据库查询当前用户的所有packets
    const userPackets = await packetRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    res.json(new PacketListResponseDto(userPackets));

  } catch (error) {
    console.error('获取用户packets时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

// GET /api/packets/:id - 获取特定packet的详细信息
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    if (isNaN(packetId)) {
      return res.status(400).json(new PacketErrorResponseDto('无效的packet ID'));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    
    // 查询特定packet，确保它属于当前用户
    const userPacket = await packetRepository.findOne({
      where: { id: packetId, userId }
    });

    if (!userPacket) {
      return res.status(404).json(new PacketErrorResponseDto('packet不存在或无权限访问'));
    }

    res.json(new PacketSingleResponseDto(userPacket, '获取packet详情成功'));

  } catch (error) {
    console.error('获取packet详情时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

// POST /api/packets - 创建新的packet
router.post('/', validationMiddleware(CreatePacketDto), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { name, description, cost, currencyCode } = req.body;
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    
    // 创建新的packet
    const newPacket = packetRepository.create({
      name,
      userId,
      description: description || null,
      cost: cost || null,
      currencyCode: currencyCode || 'USD'
    });

    const savedPacket = await packetRepository.save(newPacket);

    res.status(201).json(new PacketSingleResponseDto(savedPacket, 'packet创建成功'));

  } catch (error) {
    console.error('创建packet时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

// PUT /api/packets/:id - 更新packet
router.put('/:id', validationMiddleware(UpdatePacketDto), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    if (isNaN(packetId)) {
      return res.status(400).json(new PacketErrorResponseDto('无效的packet ID'));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    
    // 验证packet是否属于当前用户
    const existingPacket = await packetRepository.findOne({
      where: { id: packetId, userId }
    });

    if (!existingPacket) {
      return res.status(404).json(new PacketErrorResponseDto('packet不存在或无权限修改'));
    }

    // 更新packet
    Object.assign(existingPacket, updateData);
    const updatedPacket = await packetRepository.save(existingPacket);

    res.json(new PacketSingleResponseDto(updatedPacket, 'packet更新成功'));

  } catch (error) {
    console.error('更新packet时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

// DELETE /api/packets/:id - 删除packet
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    if (isNaN(packetId)) {
      return res.status(400).json(new PacketErrorResponseDto('无效的packet ID'));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    
    // 验证packet是否属于当前用户
    const existingPacket = await packetRepository.findOne({
      where: { id: packetId, userId }
    });

    if (!existingPacket) {
      return res.status(404).json(new PacketErrorResponseDto('packet不存在或无权限删除'));
    }

    // 删除packet
    await packetRepository.remove(existingPacket);

    res.json({
      success: true,
      message: 'packet删除成功'
    });

  } catch (error) {
    console.error('删除packet时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

// POST /api/packets/with-itinerary - 创建带有行程数据的packet
router.post('/with-itinerary', validationMiddleware(CreatePacketWithItineraryDto), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { name, description, cost, currencyCode, itinerary } = req.body;
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    // 开始数据库事务
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 创建 Packet
      const packetRepository = queryRunner.manager.getRepository(Packet);
      const newPacket = packetRepository.create({
        name,
        userId,
        description: description || null,
        cost: cost || null,
        currencyCode: currencyCode || 'USD'
      });
      const savedPacket = await packetRepository.save(newPacket);

      // 2. 创建 ItineraryDays 和 Markers
      const itineraryDayRepository = queryRunner.manager.getRepository(ItineraryDay);
      const markerRepository = queryRunner.manager.getRepository(Marker);

      const createdItineraryDays = [];

      for (let dayIndex = 0; dayIndex < itinerary.length; dayIndex++) {
        const dayData = itinerary[dayIndex];
        
        // 创建 ItineraryDay
        const itineraryDay = itineraryDayRepository.create({
          id: uuidv4(),
          name: dayData.dayText,
          packetId: savedPacket.id.toString(),
          dayNumber: dayData.day,
          description: dayData.description || null
        });
        const savedItineraryDay = await itineraryDayRepository.save(itineraryDay);

        // 创建该天的 Markers
        const dayMarkers = [];
        for (let trackIndex = 0; trackIndex < dayData.tracks.length; trackIndex++) {
          const track = dayData.tracks[trackIndex];
          
          const marker = markerRepository.create({
            title: track.title,
            lon: track.location.lng,
            lat: track.location.lat,
            packetId: savedPacket.id.toString(),
            userId,
            description: track.description || null,
            dayId: savedItineraryDay.id,
            type: track.type,
            sortOrder: trackIndex + 1
          });
          const savedMarker = await markerRepository.save(marker);
          dayMarkers.push(savedMarker);
        }

        // 将 markers 添加到 itineraryDay 对象中用于响应
        savedItineraryDay.markers = dayMarkers;
        createdItineraryDays.push(savedItineraryDay);
      }

      // 提交事务
      await queryRunner.commitTransaction();

      // 构建响应数据
      const responsePacket = {
        ...savedPacket,
        itineraryDays: createdItineraryDays
      };

      res.status(201).json({
        success: true,
        data: new PacketWithItineraryResponseDto(responsePacket),
        message: 'packet和行程创建成功'
      });

    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 释放查询运行器
      await queryRunner.release();
    }

  } catch (error) {
    console.error('创建packet和行程时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

// GET /api/packets/:id/with-itinerary - 获取带有完整行程数据的packet
router.get('/:id/with-itinerary', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json(new PacketErrorResponseDto('用户未认证'));
    }

    if (isNaN(packetId)) {
      return res.status(400).json(new PacketErrorResponseDto('无效的packet ID'));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    const itineraryDayRepository = AppDataSource.getRepository(ItineraryDay);
    const markerRepository = AppDataSource.getRepository(Marker);
    
    // 查询 packet
    const packet = await packetRepository.findOne({
      where: { id: packetId, userId }
    });

    if (!packet) {
      return res.status(404).json(new PacketErrorResponseDto('packet不存在或无权限访问'));
    }

    // 查询行程天数
    const itineraryDays = await itineraryDayRepository.find({
      where: { packetId: packetId.toString() },
      order: { dayNumber: 'ASC' }
    });

    // 为每个行程天数查询标记点
    for (const day of itineraryDays) {
      const markers = await markerRepository.find({
        where: { dayId: day.id },
        order: { sortOrder: 'ASC' }
      });
      day.markers = markers;
    }

    const responsePacket = {
      ...packet,
      itineraryDays
    };

    res.json({
      success: true,
      data: new PacketWithItineraryResponseDto(responsePacket),
      message: '获取packet和行程详情成功'
    });

  } catch (error) {
    console.error('获取packet和行程详情时出错:', error);
    res.status(500).json(new PacketErrorResponseDto(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

export default router; 