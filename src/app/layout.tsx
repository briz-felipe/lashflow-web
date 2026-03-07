import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LashFlow — Gestão de Salão",
  description: "Sistema de gestão para salão de lash design",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
