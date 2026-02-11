import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emoji Search Engine",
  description: "Search and copy emojis instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
