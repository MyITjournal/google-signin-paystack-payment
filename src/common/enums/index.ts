// Transaction Status Enum
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// Wallet Transaction Type Enum
export enum WalletTransactionType {
  CREDIT = 'credit', // Money coming in (funding, refund)
  DEBIT = 'debit', // Money going out (withdrawal, payment)
  TRANSFER_IN = 'transfer_in', // Received from another user
  TRANSFER_OUT = 'transfer_out', // Sent to another user
}
