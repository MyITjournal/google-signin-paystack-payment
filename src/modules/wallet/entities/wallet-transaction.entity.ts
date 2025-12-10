import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base-entity';
import { Wallet } from './wallet.entity';
import {
  WalletTransactionType,
  TransactionStatus,
} from '../../../common/enums';

@Entity('wallet_transactions')
export class WalletTransaction extends BaseEntity {
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 15, scale: 2, name: 'balance_before' })
  balance_before: number;

  @Column('decimal', { precision: 15, scale: 2, name: 'balance_after' })
  balance_after: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  metadata: string;
}
