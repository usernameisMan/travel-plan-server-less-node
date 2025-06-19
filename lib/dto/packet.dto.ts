import { IsString, IsOptional, IsDecimal, IsNotEmpty, Length } from "class-validator";
import { Transform } from "class-transformer";

export class CreatePacketDto {
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
}

export class UpdatePacketDto {
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
    this.data = packets.map(packet => new PacketResponseDto(packet));
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