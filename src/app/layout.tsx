import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stillroom — The Last Row",
  description: "A gentle digital housekeeping ritual. Make room for what's next.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
