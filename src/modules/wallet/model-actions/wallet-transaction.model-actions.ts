import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { Injectable } from '@nestjs/common';
import { AbstractModelAction } from '@hng-sdk/orm';
import {
  WalletTransactionType,
  TransactionStatus,
} from '../../../common/enums';
import { Wallet } from '../entities/wallet.entity';

@Injectable()
export class WalletTransactionModelActions extends AbstractModelAction<WalletTransaction> {
  constructor(
    @InjectRepository(WalletTransaction)
    walletTransactionRepository: Repository<WalletTransaction>,
  ) {
    super(walletTransactionRepository, WalletTransaction);
  }

  /**
   * Find wallet transaction by reference
   */
  async findByReference(reference: string): Promise<WalletTransaction | null> {
    return this.repository.findOne({
      where: { reference },
    });
  }

  /**
   * Create wallet transaction
   */
  async createTransaction(data: {
    wallet: Wallet;
    type: WalletTransactionType;
    amount: number;
    reference: string;
    status: TransactionStatus;
    description?: string;
    balanceBefore: number;
    balanceAfter: number;
  }): Promise<WalletTransaction> {
    const transactionData = {
      wallet: data.wallet,
      type: data.type,
      amount: data.amount,
      reference: data.reference,
      status: data.status,
      description: data.description,
      balance_before: data.balanceBefore,
      balance_after: data.balanceAfter,
    };

    return this.create({
      createPayload: transactionData,
      transactionOptions: { useTransaction: false },
    });
  }

  /**
   * Get transaction history for wallet
   */
  async getHistory(
    walletId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<WalletTransaction[]> {
    return this.repository.find({
      where: { wallet: { id: walletId } },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    transaction: WalletTransaction,
    status: TransactionStatus,
  ): Promise<WalletTransaction> {
    transaction.status = status;
    return this.save({
      entity: transaction,
      transactionOptions: { useTransaction: false },
    });
  }
}
