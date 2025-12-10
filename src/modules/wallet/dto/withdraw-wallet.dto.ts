import {
  IsNumber,
  IsPositive,
  IsInt,
  IsString,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class WithdrawWalletDto {
  @IsNumber()
  @IsPositive()
  @IsInt()
  amount: number; // Amount in kobo

  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  account_number: string;

  @IsString()
  @IsNotEmpty()
  bank_code: string; // Paystack bank code
}
