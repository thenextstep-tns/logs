import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ShieldAlert, Compass, Sparkles, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "ESO Trial Roster & Build Prophet",
  description: "Veteran Hard Mode ESO Trial Roster, Kill-Time Constraints, and Build Combinations Analyzer",
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-eso-gold to-eso-goldDark flex items-center justify-center shadow-lg shadow-eso-gold/10 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 text-eso-dark stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-wide text-white group-hover:text-eso-goldLight transition-colors">
                    PROPHET
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-eso-border/80 text-eso-gold font-mono uppercase tracking-wider border border-eso-gold/30">
                    Veteran HM
                  </span>
                </div>
                <p className="text-xs text-slate-400">ESOlogs Hard Mode Roster & Meta Engine</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-eso-card border border-eso-border text-slate-300">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Difficulty 122 (HM)</span>
                <span className="text-slate-500">•</span>
                <span>Kills Only</span>
              </div>
              <Link
                href="/"
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-eso-card hover:bg-eso-cardHover border border-eso-border hover:border-eso-gold/40 text-slate-200 hover:text-white transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-eso-gold" />
                <span>Trial List</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-eso-border/60 bg-eso-dark/40 py-6 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              ESOlogs Veteran Hard Mode Roster Prophet • Dynamic Live Aggregation
            </p>
            <p className="text-slate-600 font-mono">
              Enforcing Difficulty 122 &amp; Speed Rankings
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
