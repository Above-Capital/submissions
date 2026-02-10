export type ThemeMode = "system" | "light" | "dark";

export type TxnType = "income" | "expense" | "transfer";

export type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive number
  type: TxnType;
  category: string;
  account: string;
  note?: string;
};

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type FinanceState = {
  version: 1;
  themeMode: ThemeMode;
  transactions: Transaction[];
  budgets: Budget[];
  accounts: string[];
  categories: string[];
};
