import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todas Unidas X LingOrm",
  description: "Generador de mensajes variados y sin emojis para tendencias de LingOrm en X.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
