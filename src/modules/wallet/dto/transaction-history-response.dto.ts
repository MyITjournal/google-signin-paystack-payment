import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class TransactionHistoryResponseDto {
  @ApiHideProperty()
  id: string;

  @ApiProperty({
    description: 'Transaction type',
    example: 'credit',
  })
  type: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 28,
  })
  amount: number;

  @ApiHideProperty()
  balance_before: number;

  @ApiHideProperty()
  balance_after: number;

  @ApiProperty({
    description: 'Transaction status',
    example: 'success',
  })
  status: string;

  @ApiHideProperty()
  reference: string;

  @ApiHideProperty()
  description: string;

  @ApiHideProperty()
  metadata: any;

  @ApiHideProperty()
  created_at: Date;
}
