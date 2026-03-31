import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { BackendStatusBanner } from "@/components/shared/backend-status-banner";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Payroll Workspace",
  description: "Enterprise payroll management frontend foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.variable} antialiased`}>
        <BackendStatusBanner />
        {children}
      </body>
    </html>
  );
}
