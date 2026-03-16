import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowSync - Automate Your Workflow",
  description: "The modern SaaS platform for streamlining your business operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
