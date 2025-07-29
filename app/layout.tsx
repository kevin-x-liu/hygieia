/**
 * Root Layout Component - This is the fundamental layout component for Next.js App Router
 * 
 * This file defines the layout that wraps ALL pages in the application.
 * In Next.js App Router, layout.tsx is a special file that:
 * - Persists between route changes (it doesn't re-render when navigating between pages)
 * - Can fetch data independently
 * - Enables nested layouts with multiple files
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Providers from "./components/Providers";

// Next.js has built-in font optimization - fonts are loaded from Google but 
// served from your own domain for better performance and privacy
const geistSans = Geist({
  variable: "--font-geist-sans", // Creates a CSS variable that can be used in stylesheets
  subsets: ["latin"],           // Specifies which character subsets to include (optimizes loading)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata API for SEO and page information
// This can be overridden in individual page components
export const metadata: Metadata = {
  title: "AI Pantry Assistant",
  description: "Manage your ingredients and get AI-powered meal suggestions",
};

// The Root Layout component must contain html and body tags
// The children prop represents all the nested pages/layouts
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
