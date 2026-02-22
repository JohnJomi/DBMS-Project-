import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metro Ticket Management System",
  description: "DBMS Mini Project - Metro Ticket Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
