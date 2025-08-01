import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import { AppDataSource } from "../lib/data-source";
import { Packet } from "../lib/entities/Packet";
import { ItineraryDay } from "../lib/entities/ItineraryDay";
import { Marker } from "../lib/entities/Marker";
import {
  CreatePacketDto,
  UpdatePacketDto,
  PacketListResponseDto,
  PacketSingleResponseDto,
  PacketErrorResponseDto,
  ItineraryDayDto,
  MarkerDto,
} from "../lib/dto/packet.dto";
import {
  CreatePacketWithItineraryDto,
  PacketWithItineraryResponseDto,
} from "../lib/dto/itinerary.dto";
import { validationMiddleware } from "./middleware/validation";
import { v4 as uuidV4 } from "uuid";
import * as _ from "lodash";
import { In } from "typeorm";
import { PacketShareAccess } from "../lib/entities/PacketShareAccess";
import {
  CreateShareDto,
  ShareResponseDto,
  ShareErrorResponseDto,
} from "../lib/dto/share.dto";

const router: ExpressRouter = Router();

// GET /api/packets - Get all packets for current user
router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("=== GET /api/packets Debug Start ===");
    console.log("Request headers authorization:", req.headers.authorization ? "Present" : "Missing");
    console.log("Request user object:", req.user);
    
    const userId = req.user?.sub;
    console.log("Extracted userId:", userId);

    if (!userId) {
      console.log("❌ No userId found, returning 401");
      return res
        .status(401)
        .json(new PacketErrorResponseDto("User not authenticated"));
    }

    // Check if AppDataSource is initialized
    if (!AppDataSource.isInitialized) {
      console.log("❌ AppDataSource not initialized");
      return res
        .status(500)
        .json(new PacketErrorResponseDto("Database connection not initialized"));
    }

    console.log("✅ Getting packet repository...");
    const packetRepository = AppDataSource.getRepository(Packet);

    console.log("🔍 Querying packets for userId:", userId);
    // get all packets of current user from database
    const userPackets = await packetRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    console.log("📦 Found packets count:", userPackets?.length || 0);
    console.log("📦 Packet sample (first item):", userPackets?.[0] ? {
      id: userPackets[0].id,
      name: userPackets[0].name,
      userId: userPackets[0].userId,
      createdAt: userPackets[0].createdAt
    } : "No packets");

    console.log("📋 Creating response DTO...");
    const response = new PacketListResponseDto(userPackets);
    console.log("✅ Response DTO created successfully");
    console.log("=== GET /api/packets Debug End ===");

    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching user packets:");
    console.error("Error name:", (error as any)?.name);
    console.error("Error message:", (error as any)?.message);
    console.error("Error stack:", (error as any)?.stack);
    console.error("Full error object:", error);
    
    res
      .status(500)
      .json(
        new PacketErrorResponseDto(
          "Internal server error",
          process.env.NODE_ENV === "development" ? error : undefined
        )
      );
  }
});

// GET /api/packets/:id - Get specific packet details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);

    if (!userId) {
      return res
        .status(401)
        .json(new PacketErrorResponseDto("User not authenticated"));
    }

    if (isNaN(packetId)) {
      return res
        .status(400)
        .json(new PacketErrorResponseDto("Invalid packet ID"));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    const itineraryDayRepository = AppDataSource.getRepository(ItineraryDay);
    const markerRepository = AppDataSource.getRepository(Marker);

    // Query specific packet, ensure it belongs to current user
    const userPacket = await packetRepository.findOne({
      where: { id: packetId, userId },
    });

    const itineraryDays = await itineraryDayRepository.find({
      where: { packetId: packetId.toString() },
    });
    const itineraryDaysIds = itineraryDays.map((day) => day.id);

    const markers = await markerRepository.find({
      where: { dayId: In(itineraryDaysIds) },
    });

    if (!userPacket || !itineraryDays || !markers) {
      return res
        .status(404)
        .json(new PacketErrorResponseDto("Packet not found or access denied"));
    }


    userPacket.itineraryDays = itineraryDays.map((itineraryDay)=> {
      return {
        ...itineraryDay,
        markers: markers.filter((marker) => marker.dayId === itineraryDay.id),
      }
    })

    res.json(
      new PacketSingleResponseDto(
        userPacket,
        "Packet details retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching packet details:", error);
    res
      .status(500)
      .json(
        new PacketErrorResponseDto(
          "Internal server error",
          process.env.NODE_ENV === "development" ? error : undefined
        )
      );
  }
});

// POST /api/packets - Create new packet
router.post(
  "/",
  validationMiddleware(CreatePacketDto),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res
          .status(401)
          .json(new PacketErrorResponseDto("User not authenticated"));
      }

      const { name, description, cost, currencyCode, itineraryDays } = req.body;

      const allMarker: any[] = [];

      const itineraryDaysInfo = itineraryDays.map((day: ItineraryDayDto) => {
        const dayId = uuidV4();
        day.markers?.forEach((marker: MarkerDto, index: number) => {
          allMarker.push({
            ...marker,
            dayId: dayId,
            sortOrder: index,
            id: uuidV4(),
            userId,
            lng: marker.location.lng,
            lat: marker.location.lat,
          });
        });

        return {
          id: dayId,
          day: day.day,
          dayText: day.dayText,
          description: day.description,
        };
      });

      const packetRepository = AppDataSource.getRepository(Packet);

      // create new packet
      const newPacket = packetRepository.create({
        name,
        userId,
        description: description || null,
        cost: cost || null,
        currencyCode: currencyCode || "USD",
      });

      const savedPacket = await packetRepository.save(newPacket);

      if (!_.isEmpty(itineraryDaysInfo)) {
        const itineraryDayRepository =
          AppDataSource.getRepository(ItineraryDay);
        const itineraryDays = itineraryDayRepository.create(
          itineraryDaysInfo.map((day: ItineraryDayDto, index: number) => {
            return {
              ...day,
              name:day.dayText,
              dayNumber: index + 1,
              sortOrder: index,
              packetId: savedPacket.id.toString(),
            };
          })
        );
        await itineraryDayRepository.save(itineraryDays);
      }

      if (!_.isEmpty(allMarker)) {
        const markerRepository = AppDataSource.getRepository(Marker);
        const markers = markerRepository.create(allMarker.map((marker: any) => {
          return {
            ...marker,
            packetId: savedPacket.id.toString(),
            userId,
          };
        }));
        await markerRepository.save(markers);
      }

      res
        .status(201)
        .json(
          new PacketSingleResponseDto(
            savedPacket,
            "Packet created successfully"
          )
        );
    } catch (error) {
      console.error("Error creating packet:", error);
      res
        .status(500)
        .json(
          new PacketErrorResponseDto(
            "Internal server error",
            process.env.NODE_ENV === "development" ? error : undefined
          )
        );
    }
  }
);

// PUT /api/packets/:id - Update packet
router.put(
  "/:id",
  validationMiddleware(CreatePacketDto), // 使用 CreatePacketDto 因为需要完整的数据结构
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      const packetId = parseInt(req.params.id);
      const { name, description, cost, currencyCode, itineraryDays } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new PacketErrorResponseDto("User not authenticated"));
      }

      if (isNaN(packetId)) {
        return res
          .status(400)
          .json(new PacketErrorResponseDto("Invalid packet ID"));
      }

      // Start database transaction for atomicity
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const packetRepository = queryRunner.manager.getRepository(Packet);
        const itineraryDayRepository = queryRunner.manager.getRepository(ItineraryDay);
        const markerRepository = queryRunner.manager.getRepository(Marker);

        // 1. Verify packet belongs to current user
        const existingPacket = await packetRepository.findOne({
          where: { id: packetId, userId },
        });

        if (!existingPacket) {
          await queryRunner.rollbackTransaction();
          return res
            .status(404)
            .json(
              new PacketErrorResponseDto("Packet not found or access denied")
            );
        }

        // 2. Update packet basic info
        Object.assign(existingPacket, {
          name,
          description: description || null,
          cost: cost || null,
          currencyCode: currencyCode || "USD",
        });
        const updatedPacket = await packetRepository.save(existingPacket);

        // 3. Get existing itinerary days and markers for this packet
        const existingItineraryDays = await itineraryDayRepository.find({
          where: { packetId: packetId.toString() },
        });
        const existingItineraryDayIds = existingItineraryDays.map((day) => day.id);
        const existingMarkers = await markerRepository.find({
          where: { dayId: In(existingItineraryDayIds) },
        });

        // 4. Process itinerary days and markers
        const allMarkers: any[] = [];
        const processedItineraryDays: any[] = [];
        const incomingItineraryDayIds: string[] = [];
        const incomingMarkerIds: string[] = [];

        itineraryDays.forEach((day: ItineraryDayDto, dayIndex: number) => {
          // Generate new ID if not provided
          const dayId = day.id || uuidV4();
          incomingItineraryDayIds.push(dayId);

          // Process markers for this day
          day.markers?.forEach((marker: MarkerDto, markerIndex: number) => {
            const markerId = marker.id || uuidV4();
            incomingMarkerIds.push(markerId);

            allMarkers.push({
              id: markerId,
              title: marker.title,
              description: marker.description,
              type: marker.type,
              lng: marker.location.lng,
              lat: marker.location.lat,
              sortOrder: markerIndex,
              dayId: dayId,
              packetId: packetId.toString(),
              userId,
            });
          });

          processedItineraryDays.push({
            id: dayId,
            name: day.dayText || (day as any).name, // 兼容前端传入的 dayText 和从 GET 接口获取的 name
            dayNumber: dayIndex + 1,
            sortOrder: dayIndex,
            description: day.description,
            packetId: packetId.toString(),
          });
        });

        // 5. Delete markers that are no longer in the incoming data
        const markersToDelete = existingMarkers.filter(
          (marker) => !incomingMarkerIds.includes(marker.id)
        );
        if (markersToDelete.length > 0) {
          await markerRepository.remove(markersToDelete);
        }

        // 6. Delete itinerary days that are no longer in the incoming data
        const itineraryDaysToDelete = existingItineraryDays.filter(
          (day) => !incomingItineraryDayIds.includes(day.id)
        );
        if (itineraryDaysToDelete.length > 0) {
          await itineraryDayRepository.remove(itineraryDaysToDelete);
        }

        // 7. Upsert itinerary days
        if (processedItineraryDays.length > 0) {
          for (const dayData of processedItineraryDays) {
            const existingDay = existingItineraryDays.find(d => d.id === dayData.id);
            if (existingDay) {
              // Update existing
              Object.assign(existingDay, dayData);
              await itineraryDayRepository.save(existingDay);
            } else {
              // Create new
              const newDay = itineraryDayRepository.create(dayData);
              await itineraryDayRepository.save(newDay);
            }
          }
        }

        // 8. Upsert markers
        if (allMarkers.length > 0) {
          for (const markerData of allMarkers) {
            const existingMarker = existingMarkers.find(m => m.id === markerData.id);
            if (existingMarker) {
              // Update existing
              Object.assign(existingMarker, markerData);
              await markerRepository.save(existingMarker);
            } else {
              // Create new
              const newMarker = markerRepository.create(markerData);
              await markerRepository.save(newMarker);
            }
          }
        }

        // Commit transaction
        await queryRunner.commitTransaction();

        res.json(
          new PacketSingleResponseDto(
            updatedPacket,
            "Packet updated successfully"
          )
        );
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error("Error updating packet:", error);
      res
        .status(500)
        .json(
          new PacketErrorResponseDto(
            "Internal server error",
            process.env.NODE_ENV === "development" ? error : undefined
          )
        );
    }
  }
);

// DELETE /api/packets/:id - Delete packet
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);

    if (!userId) {
      return res
        .status(401)
        .json(new PacketErrorResponseDto("User not authenticated"));
    }

    if (isNaN(packetId)) {
      return res
        .status(400)
        .json(new PacketErrorResponseDto("Invalid packet ID"));
    }

    // Start database transaction for atomicity
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const packetRepository = queryRunner.manager.getRepository(Packet);
      const itineraryDayRepository = queryRunner.manager.getRepository(ItineraryDay);
      const markerRepository = queryRunner.manager.getRepository(Marker);

      // Verify packet belongs to current user
      const existingPacket = await packetRepository.findOne({
        where: { id: packetId, userId },
      });

      if (!existingPacket) {
        await queryRunner.rollbackTransaction();
        return res
          .status(404)
          .json(new PacketErrorResponseDto("Packet not found or access denied"));
      }

      // 1. Get all itinerary days for this packet
      const itineraryDays = await itineraryDayRepository.find({
        where: { packetId: packetId.toString() },
      });

      // 2. Get all markers for these itinerary days
      if (itineraryDays.length > 0) {
        const itineraryDayIds = itineraryDays.map((day) => day.id);
        const markers = await markerRepository.find({
          where: { dayId: In(itineraryDayIds) },
        });

        // 3. Delete markers first (they depend on itinerary days)
        if (markers.length > 0) {
          await markerRepository.remove(markers);
        }

        // 4. Delete itinerary days (they depend on packet)
        await itineraryDayRepository.remove(itineraryDays);
      }

      // 5. Finally delete the packet
      await packetRepository.remove(existingPacket);

      // Commit transaction
      await queryRunner.commitTransaction();

      res.json({
        success: true,
        message: "Packet and related data deleted successfully",
      });
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  } catch (error) {
    console.error("Error deleting packet:", error);
    res
      .status(500)
      .json(
        new PacketErrorResponseDto(
          "Internal server error",
          process.env.NODE_ENV === "development" ? error : undefined
        )
      );
  }
});

// POST /api/packets/with-itinerary - Create packet with itinerary data
router.post(
  "/with-itinerary",
  validationMiddleware(CreatePacketWithItineraryDto),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      const { name, description, cost, currencyCode, itinerary } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new PacketErrorResponseDto("User not authenticated"));
      }

      // Start database transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. Create Packet
        const packetRepository = queryRunner.manager.getRepository(Packet);
        const newPacket = packetRepository.create({
          name,
          userId,
          description: description || null,
          cost: cost || null,
          currencyCode: currencyCode || "USD",
        });
        const savedPacket = await packetRepository.save(newPacket);

        // 2. Create ItineraryDays and Markers
        const itineraryDayRepository =
          queryRunner.manager.getRepository(ItineraryDay);
        const markerRepository = queryRunner.manager.getRepository(Marker);

        const createdItineraryDays = [];

        for (let dayIndex = 0; dayIndex < itinerary.length; dayIndex++) {
          const dayData = itinerary[dayIndex];

          // Create ItineraryDay
          const itineraryDay = itineraryDayRepository.create({
            id: uuidV4(),
            name: dayData.dayText,
            packetId: savedPacket.id.toString(),
            dayNumber: dayData.day,
            description: dayData.description || null,
          });
          const savedItineraryDay = await itineraryDayRepository.save(
            itineraryDay
          );

          // Create Markers for this day
          const dayMarkers = [];
          for (
            let trackIndex = 0;
            trackIndex < dayData.tracks.length;
            trackIndex++
          ) {
            const track = dayData.tracks[trackIndex];

            const marker = markerRepository.create({
              title: track.title,
              lng: track.location.lng,
              lat: track.location.lat,
              packetId: savedPacket.id.toString(),
              userId,
              description: track.description || null,
              dayId: savedItineraryDay.id,
              type: track.type,
              sortOrder: trackIndex + 1,
            });
            const savedMarker = await markerRepository.save(marker);
            dayMarkers.push(savedMarker);
          }

          // Add markers to itineraryDay object for response
          savedItineraryDay.markers = dayMarkers;
          createdItineraryDays.push(savedItineraryDay);
        }

        // Commit transaction
        await queryRunner.commitTransaction();

        // Build response data
        const responsePacket = {
          ...savedPacket,
          itineraryDays: createdItineraryDays,
        };

        res.status(201).json({
          success: true,
          data: new PacketWithItineraryResponseDto(responsePacket),
          message: "Packet and itinerary created successfully",
        });
      } catch (error) {
        // Rollback transaction
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error("Error creating packet and itinerary:", error);
      res
        .status(500)
        .json(
          new PacketErrorResponseDto(
            "Internal server error",
            process.env.NODE_ENV === "development" ? error : undefined
          )
        );
    }
  }
);

// GET /api/packets/:id/with-itinerary - Get packet with complete itinerary data
router.get("/:id/with-itinerary", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);

    if (!userId) {
      return res
        .status(401)
        .json(new PacketErrorResponseDto("User not authenticated"));
    }

    if (isNaN(packetId)) {
      return res
        .status(400)
        .json(new PacketErrorResponseDto("Invalid packet ID"));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    const itineraryDayRepository = AppDataSource.getRepository(ItineraryDay);
    const markerRepository = AppDataSource.getRepository(Marker);

    // Query packet
    const packet = await packetRepository.findOne({
      where: { id: packetId, userId },
    });

    if (!packet) {
      return res
        .status(404)
        .json(new PacketErrorResponseDto("Packet not found or access denied"));
    }

    // Query itinerary days
    const itineraryDays = await itineraryDayRepository.find({
      where: { packetId: packetId.toString() },
      order: { dayNumber: "ASC" },
    });

    // Query markers for each itinerary day
    for (const day of itineraryDays) {
      const markers = await markerRepository.find({
        where: { dayId: day.id },
        order: { sortOrder: "ASC" },
      });
      day.markers = markers;
    }

    const responsePacket = {
      ...packet,
      itineraryDays,
    };

    res.json({
      success: true,
      data: new PacketWithItineraryResponseDto(responsePacket),
      message: "Packet and itinerary details retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching packet and itinerary details:", error);
    res
      .status(500)
      .json(
        new PacketErrorResponseDto(
          "Internal server error",
          process.env.NODE_ENV === "development" ? error : undefined
        )
      );
  }
});

// Helper function to generate share code
function generateShareCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude confusing characters
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/packets/:id/share - Enable sharing for a packet
router.post(
  "/:id/share",
  validationMiddleware(CreateShareDto),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      const packetId = parseInt(req.params.id);
      const { shareType, description } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ShareErrorResponseDto("User not authenticated"));
      }

      if (isNaN(packetId)) {
        return res
          .status(400)
          .json(new ShareErrorResponseDto("Invalid packet ID"));
      }

      const packetRepository = AppDataSource.getRepository(Packet);

      // Verify packet belongs to current user
      const packet = await packetRepository.findOne({
        where: { id: packetId, userId },
      });

      if (!packet) {
        return res
          .status(404)
          .json(
            new ShareErrorResponseDto("Packet not found or access denied")
          );
      }

      // Generate unique share code
      let shareCode = generateShareCode();
      let attempts = 0;
      
      // Ensure share code is unique
      while (attempts < 10) {
        const existingPacket = await packetRepository.findOne({
          where: { shareCode },
        });
        
        if (!existingPacket) {
          break;
        }
        
        shareCode = generateShareCode();
        attempts++;
      }

      if (attempts >= 10) {
        return res
          .status(500)
          .json(new ShareErrorResponseDto("Failed to generate unique share code"));
      }

      // Update packet with sharing information
      packet.shareCode = shareCode;
      packet.shareType = shareType;
      packet.shareEnabledAt = new Date();
      packet.shareViews = 0;

      await packetRepository.save(packet);

      // Get base URL from request or environment
      const baseUrl = process.env.FRONTEND_URL || "https://yourapp.com";

      res.json(
        new ShareResponseDto(
          packet,
          "Sharing enabled successfully",
          baseUrl
        )
      );
    } catch (error) {
      console.error("Error enabling sharing:", error);
      res
        .status(500)
        .json(
          new ShareErrorResponseDto(
            "Internal server error",
            process.env.NODE_ENV === "development" ? error : undefined
          )
        );
    }
  }
);

// DELETE /api/packets/:id/share - Disable sharing for a packet
router.delete("/:id/share", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);

    if (!userId) {
      return res
        .status(401)
        .json(new ShareErrorResponseDto("User not authenticated"));
    }

    if (isNaN(packetId)) {
      return res
        .status(400)
        .json(new ShareErrorResponseDto("Invalid packet ID"));
    }

    const packetRepository = AppDataSource.getRepository(Packet);

    // Verify packet belongs to current user
    const packet = await packetRepository.findOne({
      where: { id: packetId, userId },
    });

    if (!packet) {
      return res
        .status(404)
        .json(
          new ShareErrorResponseDto("Packet not found or access denied")
        );
    }

    if (!packet.shareCode) {
      return res
        .status(400)
        .json(new ShareErrorResponseDto("Packet is not currently shared"));
    }

    // Disable sharing
    packet.shareCode = null;
    packet.shareType = "private";
    packet.shareEnabledAt = null;

    await packetRepository.save(packet);

    res.json({
      success: true,
      message: "Sharing disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling sharing:", error);
    res
      .status(500)
      .json(
        new ShareErrorResponseDto(
          "Internal server error",
          process.env.NODE_ENV === "development" ? error : undefined
        )
      );
  }
});

// GET /api/packets/:id/share/stats - Get sharing statistics
router.get("/:id/share/stats", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const packetId = parseInt(req.params.id);

    if (!userId) {
      return res
        .status(401)
        .json(new ShareErrorResponseDto("User not authenticated"));
    }

    if (isNaN(packetId)) {
      return res
        .status(400)
        .json(new ShareErrorResponseDto("Invalid packet ID"));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    const shareAccessRepository = AppDataSource.getRepository(PacketShareAccess);

    // Verify packet belongs to current user
    const packet = await packetRepository.findOne({
      where: { id: packetId, userId },
    });

    if (!packet) {
      return res
        .status(404)
        .json(
          new ShareErrorResponseDto("Packet not found or access denied")
        );
    }

    if (!packet.shareCode) {
      return res
        .status(400)
        .json(new ShareErrorResponseDto("Packet is not currently shared"));
    }

    // Get recent access logs
    const recentAccess = await shareAccessRepository.find({
      where: { packetId: packet.id },
      order: { accessedAt: "DESC" },
      take: 10,
    });

    const stats = {
      views: packet.shareViews || 0,
      shareCode: packet.shareCode,
      shareType: packet.shareType,
      shareEnabledAt: packet.shareEnabledAt,
      recentAccess: recentAccess.map(access => ({
        accessedAt: access.accessedAt,
        accessType: access.accessType,
        visitorIp: access.visitorIp,
      })),
    };

    res.json({
      success: true,
      data: stats,
      message: "Share statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching share statistics:", error);
    res
      .status(500)
      .json(
        new ShareErrorResponseDto(
          "Internal server error",
          process.env.NODE_ENV === "development" ? error : undefined
        )
      );
  }
});

export default router;
