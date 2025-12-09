import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { CurrentUser, RequirePermission } from '../../common/decorators';
import { FundWalletDto } from './dto/fund-wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  @UseGuards(JwtOrApiKeyGuard)
  @RequirePermission('deposit')
  @HttpCode(HttpStatus.CREATED)
  async fundWallet(@CurrentUser() user: any, @Body() dto: FundWalletDto) {
    return this.walletService.initiateFunding(user.userId, dto);
  }
}
