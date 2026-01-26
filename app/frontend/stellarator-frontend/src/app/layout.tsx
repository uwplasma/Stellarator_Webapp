import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "UWPlasma Stellarators",
  description: "Stellarator Database at the University of Wisconsin-Madison",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${geist.variable}`}
        style={{ backgroundColor: '#ffffff', overflowX: 'hidden' }}
      >
        {children}
      </body>
    </html>
  );
}
