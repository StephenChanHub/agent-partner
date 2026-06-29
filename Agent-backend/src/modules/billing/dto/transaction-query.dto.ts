import { IsOptional, IsString } from 'class-validator';

export class TransactionQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;
}
