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
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { SYS_MESSAGES } from '../../common/constants/sys-messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initiatePayment(dto, user.userId, user.email);
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

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getTransactionHistory(@CurrentUser() user: any) {
    return this.paymentsService.getUserTransactions(user.userId);
  }

  @Get(':reference/status')
  @UseGuards(JwtAuthGuard)
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

  @Post(':reference/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyTransaction(@Param('reference') reference: string) {
    if (!reference || reference.trim() === '') {
      throw new BadRequestException(SYS_MESSAGES.INVALID_INPUT);
    }
    return this.paymentsService.getTransactionStatus(reference, true);
  }

  @Get('callback')
  async handleCallback(@Query('reference') reference: string) {
    if (!reference || reference.trim() === '') {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">Payment Error</h1>
            <p>Invalid payment reference</p>
          </body>
        </html>
      `;
    }

    try {
      // Auto-verify the payment
      const result = await this.paymentsService.getTransactionStatus(
        reference,
        true,
      );

      const isSuccess = result.status === 'success';
      const statusColor = isSuccess ? '#4caf50' : '#ff9800';
      const statusText = isSuccess ? 'Payment Successful!' : 'Payment Pending';

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Status</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .status { color: ${statusColor}; margin: 20px 0; }
              .details { background: #f5f5f5; padding: 20px; border-radius: 8px; max-width: 500px; margin: 20px auto; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { font-weight: bold; }
              button { background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px; }
              button:hover { background: #1565c0; }
            </style>
          </head>
          <body>
            <h1 class="status">${statusText}</h1>
            <div class="details">
              <div class="detail-row">
                <span class="label">Reference:</span>
                <span>${result.reference}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span>₦${(result.amount / 100).toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span>${result.status}</span>
              </div>
              ${
                result.paid_at
                  ? `
              <div class="detail-row">
                <span class="label">Paid At:</span>
                <span>${new Date(result.paid_at).toLocaleString()}</span>
              </div>
              `
                  : ''
              }
            </div>
            <button onclick="window.close()">Close Window</button>
            <script>
              // Auto-close after 5 seconds if payment is successful
              ${isSuccess ? 'setTimeout(() => window.close(), 5000);' : ''}
            </script>
          </body>
        </html>
      `;
    } catch (error) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">Payment Verification Error</h1>
            <p>${error.message || 'Unable to verify payment'}</p>
            <button onclick="window.close()" style="background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px;">Close Window</button>
          </body>
        </html>
      `;
    }
  }
}
