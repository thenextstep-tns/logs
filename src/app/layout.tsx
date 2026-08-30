import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { DodoIcon } from "@/components/DodoIcon";

export const metadata: Metadata = {
  title: "Dodo Scribe",
  description: "ESO Trial Roster & Build Analytics",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col selection:bg-yellow-500/30 selection:text-yellow-200">
        <header className="border-b border-eso-border/60 bg-eso-dark/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-eso-gold to-eso-goldDark flex items-center justify-center shadow-lg shadow-eso-gold/10 group-hover:scale-105 transition-transform text-eso-dark">
                <DodoIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg tracking-wide text-white group-hover:text-eso-goldLight transition-colors">
                Dodo Scribe
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
