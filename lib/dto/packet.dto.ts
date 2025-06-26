import {
  IsString,
  IsOptional,
  IsNotEmpty,
  Length,
  IsObject,
  IsArray,
  IsNumber,
} from "class-validator";
import { Transform } from "class-transformer";

export class LocationDto {
  @IsString({ message: "Longitude must be a string" })
  @IsNotEmpty({ message: "Longitude cannot be empty" })
  lng: string;

  @IsString({ message: "Latitude must be a string" })
  @IsNotEmpty({ message: "Latitude cannot be empty" })
  lat: string;
}

export class MarkerDto {
  @IsOptional()
  @IsString({ message: "id must is string" })
  id?: string;

  @IsOptional()
  @IsString({ message: "dayId must is string" })
  dayId?: string;

  @IsString({ message: "Type must be a string" })
  type: string;

  @IsObject({ message: "Location must be an object" })
  location: LocationDto;

  @IsOptional()
  userId: string;

  @IsOptional()
  packetId: string;

  @IsString({ message: "Title must be a string" })
  title: string;

  @IsString({ message: "Description must be a string" })
  description: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: "Sort order must be a number" }
  )
  sortOrder: number;
}

export class ItineraryDayDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: "Sort order must be a number" }
  )
  sortOrder: number;

  @IsOptional()
  @IsString({ message: "id must is string" })
  id?: string;

  @IsString({ message: "Day must be a string" })
  day: string;

  @IsString({ message: "Day text must be a string" })
  dayText: string;

  @IsString({ message: "Description must be a string" })
  description: string;

  @IsArray({ message: "Tracks must be an array" })
  markers: MarkerDto[];
}

export class CreatePacketDto {
  @IsOptional()
  @IsString({ message: "id must is string" })
  id?: string;

  @IsNotEmpty({ message: "Packet name cannot be empty" })
  @IsString({ message: "Packet name must be a string" })
  @Length(1, 255, {
    message: "Packet name length must be between 1-255 characters",
  })
  name: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 1000, {
    message: "Description length cannot exceed 1000 characters",
  })
  description?: string;

  @IsOptional()
  @IsString({ message: "Cost must be a string format number" })
  @Transform(({ value }) => value?.toString())
  cost?: string;

  @IsOptional()
  @IsString({ message: "Currency code must be a string" })
  @Length(3, 3, { message: "Currency code must be 3 characters" })
  currencyCode?: string;

  @IsNotEmpty({ message: "ItineraryDayDto cannot be empty" })
  @IsArray({ message: "ItineraryDayDto must be an array" })
  itineraryDays: ItineraryDayDto[];
}

export class UpdatePacketDto {
  @IsOptional()
  @IsNotEmpty({ message: "update need id" })
  @IsString({ message: "id must is string" })
  id?: string;

  @IsOptional()
  @IsString({ message: "Packet name must be a string" })
  @Length(1, 255, {
    message: "Packet name length must be between 1-255 characters",
  })
  name?: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 1000, {
    message: "Description length cannot exceed 1000 characters",
  })
  description?: string;

  @IsOptional()
  @IsString({ message: "Cost must be a string format number" })
  @Transform(({ value }) => value?.toString())
  cost?: string;

  @IsOptional()
  @IsString({ message: "Currency code must be a string" })
  @Length(3, 3, { message: "Currency code must be 3 characters" })
  currencyCode?: string;
}

export class PacketResponseDto {
  id: number;
  name: string;
  userId: string;
  description?: string;
  cost?: string;
  currencyCode?: string;
  createdAt: Date;
  updatedAt: Date;
  itineraryDays: any

  constructor(packet: any) {
    this.id = packet.id;
    this.name = packet.name;
    this.userId = packet.userId;
    this.description = packet.description;
    this.cost = packet.cost;
    this.currencyCode = packet.currencyCode;
    this.createdAt = packet.createdAt;
    this.updatedAt = packet.updatedAt;
    this.itineraryDays = packet.itineraryDays;
  }
}

export class PacketListResponseDto {
  success: boolean;
  data: PacketResponseDto[];
  count: number;
  message: string;

  constructor(
    packets: any[],
    message: string = "Packets retrieved successfully"
  ) {
    this.success = true;
    this.data = packets.map((packet) => new PacketResponseDto(packet));
    this.count = packets.length;
    this.message = message;
  }
}

export class PacketSingleResponseDto {
  success: boolean;
  data: PacketResponseDto;
  message: string;

  constructor(packet: any, message: string) {
    this.success = true;
    this.data = new PacketResponseDto(packet);
    this.message = message;
  }
}

export class PacketErrorResponseDto {
  success: boolean;
  message: string;
  error?: any;

  constructor(message: string, error?: any) {
    this.success = false;
    this.message = message;
    this.error = error;
  }
}
