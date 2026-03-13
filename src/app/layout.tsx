import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/layout/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkVault | Personal Link Manager",
  description: "Store and expose your favorite links with beautiful previews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
      >
        {/* Premium Background Elements */}
        <div className="fixed inset-0 -z-10 bg-background" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-40" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-30" />
        
        {children}
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  );
}
