import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import { AppDataSource } from "../lib/data-source";
import { Packet } from "../lib/entities/Packet";
import { ItineraryDay } from "../lib/entities/ItineraryDay";
import { Marker } from "../lib/entities/Marker";
import { PacketShareAccess } from "../lib/entities/PacketShareAccess";
import {
  SharedContentResponseDto,
  ShareErrorResponseDto,
} from "../lib/dto/share.dto";
import { In } from "typeorm";

const router: ExpressRouter = Router();

// GET /api/shared/:shareCode - Access shared content by share code
router.get("/:shareCode", async (req: Request, res: Response) => {
  try {
    const shareCode = req.params.shareCode;

    if (!shareCode) {
      return res
        .status(400)
        .json(new ShareErrorResponseDto("Share code is required"));
    }

    const packetRepository = AppDataSource.getRepository(Packet);
    const itineraryDayRepository = AppDataSource.getRepository(ItineraryDay);
    const markerRepository = AppDataSource.getRepository(Marker);
    const shareAccessRepository = AppDataSource.getRepository(PacketShareAccess);

    // Find packet by share code
    const packet = await packetRepository.findOne({
      where: { shareCode },
    });

    if (!packet) {
      return res
        .status(404)
        .json(new ShareErrorResponseDto("Shared content not found"));
    }

    // Check if sharing is enabled
    if (packet.shareType === "private" || !packet.shareCode) {
      return res
        .status(404)
        .json(new ShareErrorResponseDto("Shared content not found"));
    }

    // For free sharing, return complete content
    if (packet.shareType === "free") {
      // Get complete itinerary data
      const itineraryDays = await itineraryDayRepository.find({
        where: { packetId: packet.id.toString() },
        order: { dayNumber: "ASC" },
      });

      // Get all markers for these itinerary days
      if (itineraryDays.length > 0) {
        const itineraryDayIds = itineraryDays.map((day) => day.id);
        const markers = await markerRepository.find({
          where: { dayId: In(itineraryDayIds) },
          order: { sortOrder: "ASC" },
        });

        // Attach markers to each day
        itineraryDays.forEach((day) => {
          day.markers = markers.filter((marker) => marker.dayId === day.id);
        });
      }

      // Attach itinerary data to packet
      packet.itineraryDays = itineraryDays;

      // Increment view count
      packet.shareViews = (packet.shareViews || 0) + 1;
      await packetRepository.save(packet);

      // Log the access
      const accessLog = shareAccessRepository.create({
        packetId: packet.id,
        shareCode: shareCode,
        visitorIp: req.ip || req.socket.remoteAddress || null,
        visitorUserId: req.user?.sub || null, // Will be null for unauthenticated users
        accessType: "view",
        userAgent: req.headers["user-agent"] || null,
      });
      await shareAccessRepository.save(accessLog);

      return res.json(
        new SharedContentResponseDto(
          packet,
          "Shared content retrieved successfully"
        )
      );
    }

    // For paid sharing (future implementation)
    if (packet.shareType === "paid") {
      // For now, return error since we're only implementing free sharing
      return res
        .status(501)
        .json(new ShareErrorResponseDto("Paid sharing not yet implemented"));
    }

    return res
      .status(400)
      .json(new ShareErrorResponseDto("Invalid share type"));
  } catch (error) {
    console.error("Error accessing shared content:", error);
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