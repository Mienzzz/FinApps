export type TransactionType = 'income' | 'expense' | 'transfer';
export type DebtType = 'debt' | 'receivable';
export type WalletType = 'cash' | 'bank' | 'e-wallet' | 'credit';
export type Language = 'en' | 'id';
export type Theme = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  language: Language;
  theme: Theme;
  currency: string;
}

export interface Transaction {
  id?: string;
  uid: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  walletId: string;
  toWalletId?: string;
}

export interface Debt {
  id?: string;
  uid: string;
  type: DebtType;
  personName: string;
  amount: number;
  remainingAmount: number;
  dueDate?: string;
  status: 'active' | 'paid';
  note: string;
}

export interface Wallet {
  id?: string;
  uid: string;
  name: string;
  type: WalletType;
  balance: number;
  icon?: string;
}

export interface FinancialHealth {
  score: number;
  status: string;
  advice: string[];
}
