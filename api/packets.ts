import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AppDataSource } from '../lib/data-source';
import { Packet } from '../lib/entities/Packet';
import { 
  CreatePacketDto, 
  UpdatePacketDto, 
  PacketListResponseDto, 
  PacketSingleResponseDto, 
  PacketErrorResponseDto 
} from '../lib/dto/packet.dto';
import { validationMiddleware } from './middleware/validation';

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

export default router; 