import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PicklePulse",
  description: "Instant pickleball partner — waiting that feels like a rally.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-white antialiased">{children}</body>
    </html>
  );
}
