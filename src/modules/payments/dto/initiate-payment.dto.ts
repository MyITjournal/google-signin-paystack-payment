import { IsNumber, IsPositive, IsInt } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsPositive()
  @IsInt()
  amount: number; // Amount in kobo (smallest currency unit)
}
