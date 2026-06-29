import { IsString } from 'class-validator';

export class CreateRechargeOrderDto {
  @IsString()
  packageId!: string;
}
