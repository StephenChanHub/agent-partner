import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class SendEmailCodeDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['REGISTER'])
  purpose?: 'REGISTER';
}
