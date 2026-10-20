import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateQuoteStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
