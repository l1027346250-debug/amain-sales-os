import { IsObject, IsOptional, IsString } from 'class-validator';

export class TwentyWebhookDto {
  @IsString()
  event!: string;

  @IsOptional()
  @IsString()
  objectName?: string;

  @IsObject()
  data!: Record<string, unknown>;
}
