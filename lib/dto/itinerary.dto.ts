import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, IsNumber } from "class-validator";
import { Type, Transform } from "class-transformer";

export class LocationDto {
  @IsString({ message: "经度必须是字符串" })
  @IsNotEmpty({ message: "经度不能为空" })
  lng: string;

  @IsString({ message: "纬度必须是字符串" })
  @IsNotEmpty({ message: "纬度不能为空" })
  lat: string;
}

export class TrackDto {
  @IsString({ message: "类型必须是字符串" })
  @IsNotEmpty({ message: "类型不能为空" })
  type: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsString({ message: "标题必须是字符串" })
  @IsNotEmpty({ message: "标题不能为空" })
  title: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;
}

export class ItineraryDayDto {
  @IsString({ message: "day必须是字符串" })
  @IsNotEmpty({ message: "day不能为空" })
  day: string;

  @IsString({ message: "dayText必须是字符串" })
  @IsNotEmpty({ message: "dayText不能为空" })
  dayText: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;

  @IsArray({ message: "tracks必须是数组" })
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  tracks: TrackDto[];
}

export class CreatePacketWithItineraryDto {
  @IsNotEmpty({ message: "packet名称不能为空" })
  @IsString({ message: "packet名称必须是字符串" })
  name: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;

  @IsOptional()
  @IsString({ message: "费用必须是字符串格式的数字" })
  cost?: string;

  @IsOptional()
  @IsString({ message: "货币代码必须是字符串" })
  currencyCode?: string;

  @IsArray({ message: "行程数据必须是数组" })
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
    this.markers = itineraryDay.markers?.map((marker: any) => new MarkerResponseDto(marker)) || [];
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
    this.itineraryDays = packet.itineraryDays?.map((day: any) => new ItineraryResponseDto(day)) || [];
  }
} 