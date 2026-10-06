import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RAS Site Safety Forms",
  description: "Internal Site Safety Forms Application for Ron Anderson & Sons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f8faf9] text-[#2a2829] antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="py-4 px-6 text-center text-xs text-gray-500 border-t border-gray-200/60 bg-white">
          &copy; {new Date().getFullYear()} Ron Anderson & Sons (RAS). Internal Site Safety Portal.
        </footer>
      </body>
    </html>
  );
}
