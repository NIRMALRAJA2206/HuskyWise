import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huskywise",
  description:
    "Huskywise is a research-first chatbot for grounded academic Q&A with source citations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
