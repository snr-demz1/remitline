import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemitLine | Everyday money answers, in your language",
  description:
    "A multilingual voice-agent demo for exchange-house rate, transfer, and salary-card questions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

