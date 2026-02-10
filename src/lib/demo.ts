import { Budget, FinanceState, Transaction } from "./types";
import { uid } from "./utils";

export function demoState(): FinanceState {
  const tx: Transaction[] = [];
  const add = (date: string, description: string, amount: number, type: Transaction["type"], category: string, account: string) => {
    tx.push({ id: uid("tx"), date, description, amount, type, category, account });
  };

  // A couple months of sample data
  add("2026-01-02", "Paycheck", 3200, "income", "Salary", "Checking");
  add("2026-01-03", "Rent", 1850, "expense", "Housing", "Checking");
  add("2026-01-05", "Groceries", 124.51, "expense", "Food", "Checking");
  add("2026-01-06", "Coffee", 6.75, "expense", "Food", "Credit Card");
  add("2026-01-07", "Utilities", 142.22, "expense", "Utilities", "Checking");
  add("2026-01-09", "Gym", 39.99, "expense", "Health", "Credit Card");
  add("2026-01-10", "Dinner", 58.4, "expense", "Food", "Credit Card");
  add("2026-01-12", "Uber", 18.25, "expense", "Transport", "Credit Card");
  add("2026-01-15", "Transfer to Savings", 500, "transfer", "Transfer", "Checking");
  add("2026-01-15", "Savings deposit", 500, "transfer", "Transfer", "Savings");
  add("2026-01-20", "Streaming", 14.99, "expense", "Subscriptions", "Credit Card");
  add("2026-01-22", "Internet", 69.99, "expense", "Utilities", "Checking");
  add("2026-01-25", "Freelance", 650, "income", "Side Income", "Checking");
  add("2026-01-28", "Flights", 312.18, "expense", "Travel", "Credit Card");

  add("2026-02-01", "Paycheck", 3200, "income", "Salary", "Checking");
  add("2026-02-03", "Rent", 1850, "expense", "Housing", "Checking");
  add("2026-02-04", "Groceries", 97.8, "expense", "Food", "Checking");
  add("2026-02-06", "Coffee", 5.25, "expense", "Food", "Credit Card");
  add("2026-02-07", "Phone", 55, "expense", "Utilities", "Credit Card");
  add("2026-02-08", "Dining", 44.12, "expense", "Food", "Credit Card");
  add("2026-02-11", "Gas", 41.33, "expense", "Transport", "Credit Card");
  add("2026-02-12", "Concert", 120, "expense", "Fun", "Credit Card");
  add("2026-02-14", "Transfer to Savings", 600, "transfer", "Transfer", "Checking");
  add("2026-02-14", "Savings deposit", 600, "transfer", "Transfer", "Savings");
  add("2026-02-18", "Insurance", 110.0, "expense", "Insurance", "Checking");
  add("2026-02-22", "Groceries", 132.44, "expense", "Food", "Checking");
  add("2026-02-24", "Streaming", 14.99, "expense", "Subscriptions", "Credit Card");

  const categories = Array.from(new Set(tx.map((t) => t.category))).sort();
  const accounts = Array.from(new Set(tx.map((t) => t.account))).sort();

  const budgets: Budget[] = [
    { id: uid("b"), category: "Food", monthlyLimit: 500 },
    { id: uid("b"), category: "Fun", monthlyLimit: 120 },
    { id: uid("b"), category: "Travel", monthlyLimit: 300 },
    { id: uid("b"), category: "Subscriptions", monthlyLimit: 30 },
  ];

  return {
    version: 1,
    themeMode: "system",
    transactions: tx.sort((a, b) => (a.date < b.date ? 1 : -1)),
    budgets,
    accounts,
    categories,
  };
}
