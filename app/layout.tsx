import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dayli — Personal Calendar & Tasks",
  description: "A premium, minimalist personal calendar and task manager.",
  icons: {
    icon: [
      { url: "/dayli_logo.png" },
      { url: "/dayli_logo.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/dayli_logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
