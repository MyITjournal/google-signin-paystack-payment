import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Header,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { SYS_MESSAGES } from '../../common/constants/sys-messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { PaystackWebhookPayload } from '../../common/interfaces/paystack.interface';
import type { JwtPayload } from '../../common/interfaces/jwt.interface';
import { TransactionStatus } from '../../common/enums';

@Controller('payments')
@ApiExcludeController()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.initiatePayment(dto, user.userId, user.email);
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: PaystackWebhookPayload,
  ) {
    if (!signature) {
      throw new BadRequestException(SYS_MESSAGES.INVALID_SIGNATURE);
    }
    return this.paymentsService.handleWebhook(signature, payload);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getTransactionHistory(@CurrentUser() user: JwtPayload) {
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
  @Header('Content-Type', 'text/html')
  async handleCallback(@Query('reference') reference: string) {
    if (!reference || reference.trim() === '') {
      throw new BadRequestException(SYS_MESSAGES.INVALID_INPUT);
    }

    // Auto-verify the payment
    const result = await this.paymentsService.getTransactionStatus(
      reference,
      true,
    );

    // Return HTML response with payment status
    const statusColor =
      result.status === TransactionStatus.SUCCESS
        ? '#10b981'
        : result.status === TransactionStatus.PENDING
          ? '#f59e0b'
          : '#ef4444';
    const statusIcon =
      result.status === TransactionStatus.SUCCESS
        ? '✓'
        : result.status === TransactionStatus.PENDING
          ? '⏳'
          : '✗';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment ${result.status}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
              width: 100%;
              text-align: center;
            }
            .icon {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: ${statusColor};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 48px;
              margin: 0 auto 24px;
            }
            h1 {
              color: #1f2937;
              font-size: 28px;
              margin-bottom: 12px;
              text-transform: capitalize;
            }
            p {
              color: #6b7280;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .details {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 24px;
              text-align: left;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              color: #6b7280;
              font-size: 14px;
            }
            .detail-value {
              color: #1f2937;
              font-weight: 600;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 32px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
              transition: background 0.3s;
            }
            .button:hover {
              background: #5568d3;
            }
            .reference {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 20px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${statusIcon}</div>
            <h1>Payment ${result.status}</h1>
            <p>
              ${
                result.status === TransactionStatus.SUCCESS
                  ? 'Your payment has been processed successfully! Your wallet will be credited shortly via webhook.'
                  : result.status === TransactionStatus.PENDING
                    ? 'Your payment is being processed. Please wait a moment.'
                    : 'Payment failed or was cancelled. Please try again.'
              }
            </p>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value">₦${(result.amount / 100).toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value" style="color: ${statusColor}">${result.status.toUpperCase()}</span>
              </div>
            </div>
            <a href="/docs" class="button">Back to API Docs</a>
            <div class="reference">Reference: ${result.reference}</div>
          </div>
        </body>
      </html>
    `;
  }
}
