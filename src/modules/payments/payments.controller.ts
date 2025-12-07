import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { SYS_MESSAGES } from '../../common/constants/sys-messages';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    if (!signature) {
      throw new BadRequestException(SYS_MESSAGES.INVALID_SIGNATURE);
    }
    return this.paymentsService.handleWebhook(signature, payload);
  }

  @Get(':reference/status')
  async getTransactionStatus(
    @Param('reference') reference: string,
    @Query('refresh') refresh?: string,
  ) {
    if (!reference || reference.trim() === '') {
      throw new BadRequestException(SYS_MESSAGES.INVALID_INPUT);
    }
    return this.paymentsService.getTransactionStatus(
      reference,
      refresh === 'true',
    );
  }
}
