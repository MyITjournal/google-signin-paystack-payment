import { IsNumber, IsPositive, IsInt } from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @IsPositive()
  @IsInt()
  amount: number; // Amount in kobo (smallest currency unit)
}
