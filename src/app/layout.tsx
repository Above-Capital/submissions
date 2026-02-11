import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unit Converter - Drag & Drop",
  description: "A beautiful unit converter with drag-and-drop functionality",
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
