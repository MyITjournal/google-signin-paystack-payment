import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import {
  CurrentUser,
  RequirePermission,
  SkipWrap,
} from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces/jwt.interface';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { TransactionHistoryResponseDto } from './dto/transaction-history-response.dto';
import { SYS_MESSAGES } from '../../common/constants/sys-messages';
import {
  ApiGetWalletBalance,
  ApiWalletDeposit,
  ApiVerifyDepositStatus,
  ApiWalletTransfer,
  ApiTransactionHistory,
} from './docs/wallet-docs.decorator';

@Controller('wallet/api')
@ApiTags('Wallet (API Key)')
@ApiSecurity('x-api-key')
export class WalletApiController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @UseGuards(ApiKeyGuard)
  @RequirePermission('read')
  @SkipWrap()
  @ApiGetWalletBalance()
  async getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getBalance(user.userId);
  }

  @Post('deposit')
  @UseGuards(ApiKeyGuard)
  @RequirePermission('deposit')
  @HttpCode(HttpStatus.CREATED)
  @SkipWrap()
  @ApiWalletDeposit()
  async fundWallet(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FundWalletDto,
  ) {
    return this.walletService.initiateFunding(user.userId, dto);
  }

  @Get('deposit/:reference/status')
  @UseGuards(ApiKeyGuard)
  @RequirePermission('read')
  @SkipWrap()
  @ApiVerifyDepositStatus()
  async getDepositStatus(@Param('reference') reference: string) {
    if (!reference || reference.trim() === '') {
      throw new BadRequestException(SYS_MESSAGES.INVALID_INPUT);
    }
    return this.walletService.getDepositStatus(reference);
  }

  @Post('transfer')
  @UseGuards(ApiKeyGuard)
  @RequirePermission('transfer')
  @HttpCode(HttpStatus.CREATED)
  @SkipWrap()
  @ApiWalletTransfer()
  async transferToUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TransferWalletDto,
  ) {
    return this.walletService.transferToUser(user.userId, dto);
  }

  @Get('transactions')
  @UseGuards(ApiKeyGuard)
  @RequirePermission('read')
  @SkipWrap()
  @ApiTransactionHistory()
  async getTransactionHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<TransactionHistoryResponseDto[]> {
    return this.walletService.getTransactionHistory(user.userId, limit || 50);
  }
}
