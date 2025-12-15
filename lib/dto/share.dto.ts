import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

// Request DTOs
export class CreateShareDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['free', 'paid'])
  shareType: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ShareCodeDto {
  @IsNotEmpty()
  @IsString()
  shareCode: string;
}

// Response DTOs
export class ShareDataDto {
  shareCode: string;
  shareUrl: string;
  shareType: string;
  shareViews: number;
  shareEnabledAt: Date;

  constructor(packet: any, baseUrl: string = '') {
    this.shareCode = packet.shareCode;
    this.shareUrl = `${baseUrl}/shared/${packet.shareCode}`;
    this.shareType = packet.shareType;
    this.shareViews = packet.shareViews || 0;
    this.shareEnabledAt = packet.shareEnabledAt;
  }
}

export class ShareResponseDto {
  success: boolean;
  data: ShareDataDto;
  message: string;

  constructor(packet: any, message: string, baseUrl: string = '') {
    this.success = true;
    this.data = new ShareDataDto(packet, baseUrl);
    this.message = message;
  }
}

export class SharedPacketDto {
  id: number;
  name: string;
  description: string;
  shareType: string;
  shareViews: number;
  author: {
    name: string;
    userId: string;
  };
  itineraryDays: any[];
  markers: any[];
  createdAt: Date;

  constructor(packet: any) {
    this.id = packet.id;
    this.name = packet.name;
    this.description = packet.description;
    this.shareType = packet.shareType;
    this.shareViews = packet.shareViews || 0;
    this.author = {
      name: 'Travel Planner', // For now, we don't have user names
      userId: packet.userId,
    };
    this.itineraryDays = packet.itineraryDays || [];
    this.markers = packet.markers || [];
    this.createdAt = packet.createdAt;
  }
}

export class SharedContentResponseDto {
  success: boolean;
  data: {
    packet: SharedPacketDto;
  };
  message: string;

  constructor(packet: any, message: string) {
    this.success = true;
    this.data = {
      packet: new SharedPacketDto(packet),
    };
    this.message = message;
  }
}

export class ShareErrorResponseDto {
  success: boolean;
  message: string;
  error?: any;

  constructor(message: string, error?: any) {
    this.success = false;
    this.message = message;
    if (error) {
      this.error = error;
    }
  }
}