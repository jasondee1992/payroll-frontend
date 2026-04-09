import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { APP_NAME } from "@/config/branding";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Enterprise payroll management frontend foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
