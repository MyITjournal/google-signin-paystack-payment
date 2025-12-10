import {
  IsNumber,
  IsPositive,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class TransferWalletDto {
  @IsString()
  walletNumber: string;

  @IsNumber()
  @IsPositive()
  @IsInt()
  amount: number; // Amount in kobo

  @IsString()
  @IsOptional()
  description?: string;
}
