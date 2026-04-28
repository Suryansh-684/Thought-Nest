import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThoughtNest — Where Ideas Take Flight",
  description: "A premium blogging platform for thoughtful stories, powered by AI.",
  openGraph: {
    title: "ThoughtNest — Where Ideas Take Flight",
    description: "A premium blogging platform for thoughtful stories, powered by AI.",
    siteName: "ThoughtNest",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0F0F1A]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
