import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModelActions } from './model-actions/wallet.model-actions';
import { WalletTransactionModelActions } from './model-actions/wallet-transaction.model-actions';
import { SharedModule } from '../shared/shared.module';
import { ApiKeyLoggingInterceptor } from '../../common/interceptors/api-key-logging.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction]),
    SharedModule,
    AuthModule,
    ApiKeysModule,
    UsersModule,
    PaymentsModule,
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletModelActions,
    WalletTransactionModelActions,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiKeyLoggingInterceptor,
    },
  ],
  exports: [WalletService],
})
export class WalletModule {}
