import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AROMA + WAX CLP Labels",
  description: "Internal CLP label generator for AROMA + WAX",
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
