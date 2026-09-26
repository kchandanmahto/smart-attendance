import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "AI Smart Attendance System",
  description:
    "Enterprise AI-powered attendance management system",
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