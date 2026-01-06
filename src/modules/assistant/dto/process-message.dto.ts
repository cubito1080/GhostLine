import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class ProcessMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsUUID()
  @IsNotEmpty()
  artistId: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  clientName?: string;
}
