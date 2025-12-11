import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { Injectable } from '@nestjs/common';
import { AbstractModelAction } from '@hng-sdk/orm';

@Injectable()
export class WalletModelActions extends AbstractModelAction<Wallet> {
  constructor(
    @InjectRepository(Wallet)
    walletRepository: Repository<Wallet>,
  ) {
    super(walletRepository, Wallet);
  }

  /**
   * Find wallet by user ID
   */
  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * Find wallet by wallet number
   */
  async findByWalletNumber(walletNumber: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { walletNumber: walletNumber },
      relations: ['user'],
    });
  }

  /**
   * Check if wallet number exists
   */
  async walletNumberExists(walletNumber: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { walletNumber },
    });
    return count > 0;
  }

  /**
   * Create wallet for user
   */
  async createForUser(userId: string, walletNumber: string): Promise<Wallet> {
    const walletData = {
      user: { id: userId },
      walletNumber: walletNumber,
      balance: 0,
      totalFunded: 0,
      totalWithdrawn: 0,
      isLocked: false,
    };

    return this.create({
      createPayload: walletData,
      transactionOptions: { useTransaction: false },
    });
  }

  /**
   * Update wallet balance and totals
   */
  async updateBalance(
    wallet: Wallet,
    balanceChange: number,
    type: 'fund' | 'withdraw',
  ): Promise<Wallet> {
    wallet.balance = Number(wallet.balance) + balanceChange;

    if (type === 'fund') {
      wallet.totalFunded = Number(wallet.totalFunded) + Math.abs(balanceChange);
    } else if (type === 'withdraw') {
      wallet.totalWithdrawn =
        Number(wallet.totalWithdrawn) + Math.abs(balanceChange);
    }

    return this.save({
      entity: wallet,
      transactionOptions: { useTransaction: false },
    });
  }
}
