import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Too Hot to Handle — Das Spiel",
  description:
    "Neun Tage, 100.000 € und keine einzige erlaubte Berührung. Ein interaktives Reality-Show-Spiel im Browser.",
};

export const viewport: Viewport = {
  themeColor: "#0a0612",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="thth-grain antialiased">
        <div className="thth-backdrop" aria-hidden />
        <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-6">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="lana-eye inline-block size-3 rounded-full bg-heat-500 shadow-[0_0_18px_6px_rgba(244,63,94,0.55)]" />
              <span className="text-sm font-bold tracking-[0.22em] text-white/80 uppercase transition group-hover:text-white">
                Too Hot to Handle
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/cast"
                className="rounded-full px-3 py-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Cast
              </Link>
              <Link
                href="/regeln"
                className="rounded-full px-3 py-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Regeln
              </Link>
              <Link
                href="/spielen"
                className="rounded-full bg-heat-500 px-4 py-1.5 font-semibold text-white shadow-lg shadow-heat-500/25 transition hover:bg-heat-400"
              >
                Spielen
              </Link>
            </nav>
          </header>

          <main className="flex-1 pb-16">{children}</main>

          <footer className="border-t border-white/10 py-6 text-xs text-white/35">
            Fan-Projekt ohne Verbindung zu Netflix. Alle Personen und Ereignisse sind frei
            erfunden.
          </footer>
        </div>
      </body>
    </html>
  );
}
