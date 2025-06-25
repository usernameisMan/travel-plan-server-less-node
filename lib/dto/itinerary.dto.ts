import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ItineraryDayDto } from "./packet.dto";

export class CreatePacketWithItineraryDto {
  @IsNotEmpty({ message: "Packet name cannot be empty" })
  @IsString({ message: "Packet name must be a string" })
  name: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @IsOptional()
  @IsString({ message: "Cost must be a string format number" })
  cost?: string;

  @IsOptional()
  @IsString({ message: "Currency code must be a string" })
  currencyCode?: string;

  @IsArray({ message: "Itinerary data must be an array" })
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  itinerary: ItineraryDayDto[];
}

export class ItineraryResponseDto {
  id: string;
  name: string;
  packetId: string;
  dayNumber: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  markers: MarkerResponseDto[];

  constructor(itineraryDay: any) {
    this.id = itineraryDay.id;
    this.name = itineraryDay.name;
    this.packetId = itineraryDay.packetId;
    this.dayNumber = itineraryDay.dayNumber;
    this.description = itineraryDay.description;
    this.createdAt = itineraryDay.createdAt;
    this.updatedAt = itineraryDay.updatedAt;
    this.markers =
      itineraryDay.markers?.map(
        (marker: any) => new MarkerResponseDto(marker)
      ) || [];
  }
}

export class MarkerResponseDto {
  id: string;
  title: string;
  lon: string;
  lat: string;
  packetId: string;
  userId: string;
  description?: string;
  dayId: string;
  type: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(marker: any) {
    this.id = marker.id;
    this.title = marker.title;
    this.lon = marker.lon;
    this.lat = marker.lat;
    this.packetId = marker.packetId;
    this.userId = marker.userId;
    this.description = marker.description;
    this.dayId = marker.dayId;
    this.type = marker.type;
    this.sortOrder = marker.sortOrder;
    this.createdAt = marker.createdAt;
    this.updatedAt = marker.updatedAt;
  }
}

export class PacketWithItineraryResponseDto {
  id: number;
  name: string;
  userId: string;
  description?: string;
  cost?: string;
  currencyCode?: string;
  createdAt: Date;
  updatedAt: Date;
  itineraryDays: ItineraryResponseDto[];

  constructor(packet: any) {
    this.id = packet.id;
    this.name = packet.name;
    this.userId = packet.userId;
    this.description = packet.description;
    this.cost = packet.cost;
    this.currencyCode = packet.currencyCode;
    this.createdAt = packet.createdAt;
    this.updatedAt = packet.updatedAt;
    this.itineraryDays =
      packet.itineraryDays?.map((day: any) => new ItineraryResponseDto(day)) ||
      [];
  }
}
