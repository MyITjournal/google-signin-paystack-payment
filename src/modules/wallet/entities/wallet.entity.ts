import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base-entity';
import { User } from '../../users/entities/user.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true, name: 'wallet_number' })
  walletNumber: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_funded',
  })
  totalFunded: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_withdrawn',
  })
  totalWithdrawn: number;

  @Column({ default: false, name: 'is_locked' })
  isLocked: boolean;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.wallet)
  transactions: WalletTransaction[];
}
