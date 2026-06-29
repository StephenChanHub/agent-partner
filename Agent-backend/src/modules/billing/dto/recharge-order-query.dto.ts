import { IsOptional, IsString } from 'class-validator';

export class RechargeOrderQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;
}
