import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BudgetWand",
  description: "A playful financial wizard that reveals spending patterns and turns saving into quests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#070911] text-white antialiased">{children}</body>
    </html>
  );
}
