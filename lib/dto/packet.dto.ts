import {
  IsString,
  IsOptional,
  IsNotEmpty,
  Length,
  IsObject,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";


export class LocationDto {
  @IsString({ message: "经度必须是字符串" })
  @IsNotEmpty({ message: "经度不能为空" })
  lng: string;

  @IsString({ message: "纬度必须是字符串" })
  @IsNotEmpty({ message: "纬度不能为空" })
  lat: string;
}

export class MarkerDto {
  @IsOptional()
  @IsString({ message: "id must is string" })
  id?: string;

  @IsString({ message: "type必须是字符串" })
  type: string;

  @IsObject({ message: "location必须是对象" })
  location: LocationDto

  @IsString({ message: "title必须是字符串" })
  title: string;

  @IsString({ message: "description必须是字符串" })
  description: string;
}

export class ItineraryDayDto {
  @IsOptional()
  @IsString({ message: "id must is string" })
  id?: string;

  @IsString({ message: "day必须是字符串" })
  day: string;

  @IsString({ message: "dayText必须是字符串" })
  dayText: string;

  @IsString({ message: "description必须是字符串" })
  description: string;

  @IsArray({ message: "tracks必须是数组" })
  markers: MarkerDto[];
}

export class CreatePacketDto {
  @IsOptional()
  @IsString({ message: "id must is string" })
  id?: string;

  @IsNotEmpty({ message: "packet名称不能为空" })
  @IsString({ message: "packet名称必须是字符串" })
  @Length(1, 255, { message: "packet名称长度必须在1-255个字符之间" })
  name: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  @Length(0, 1000, { message: "描述长度不能超过1000个字符" })
  description?: string;

  @IsOptional()
  @IsString({ message: "费用必须是字符串格式的数字" })
  @Transform(({ value }) => value?.toString())
  cost?: string;

  @IsOptional()
  @IsString({ message: "货币代码必须是字符串" })
  @Length(3, 3, { message: "货币代码必须是3个字符" })
  currencyCode?: string;

  @IsNotEmpty({ message: "ItineraryDayDto不能为空" })
  @IsArray({ message: "ItineraryDayDto必须是数组" })
  itineraryDays: ItineraryDayDto[];
}

export class UpdatePacketDto {
  @IsOptional()
  @IsNotEmpty({ message: "update need id" })
  @IsString({ message: "id must is string" })
  id?: string;

  @IsOptional()
  @IsString({ message: "packet名称必须是字符串" })
  @Length(1, 255, { message: "packet名称长度必须在1-255个字符之间" })
  name?: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  @Length(0, 1000, { message: "描述长度不能超过1000个字符" })
  description?: string;

  @IsOptional()
  @IsString({ message: "费用必须是字符串格式的数字" })
  @Transform(({ value }) => value?.toString())
  cost?: string;

  @IsOptional()
  @IsString({ message: "货币代码必须是字符串" })
  @Length(3, 3, { message: "货币代码必须是3个字符" })
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

  constructor(packet: any) {
    this.id = packet.id;
    this.name = packet.name;
    this.userId = packet.userId;
    this.description = packet.description;
    this.cost = packet.cost;
    this.currencyCode = packet.currencyCode;
    this.createdAt = packet.createdAt;
    this.updatedAt = packet.updatedAt;
  }
}

export class PacketListResponseDto {
  success: boolean;
  data: PacketResponseDto[];
  count: number;
  message: string;

  constructor(packets: any[], message: string = "获取packets成功") {
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
