import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dayli — Personal Calendar & Tasks",
  description: "A premium, minimalist personal calendar and task manager.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden select-none font-sans">
        {children}
      </body>
    </html>
  );
}
