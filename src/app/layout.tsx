import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body-var",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display-var",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Manager Poker Deal — Tu rakeback optimizado",
    template: "%s | Manager Poker Deal",
  },
  description:
    "Plataforma integral para jugadores de poker online. Rakeback optimizado, herramientas, coaching y comunidad. El jugador solo tiene que jugar al poker, MPD resuelve todo lo demás.",
  keywords: [
    "rakeback poker",
    "afiliación poker",
    "gestión bankroll poker",
    "poker online",
    "rakeback deal",
    "poker hispanohablante",
  ],
  openGraph: {
    title: "Manager Poker Deal — Tu rakeback optimizado",
    description:
      "Plataforma integral para jugadores de poker online. Rakeback optimizado, herramientas, coaching y comunidad.",
    url: "https://managerpoker.deal",
    siteName: "Manager Poker Deal",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manager Poker Deal — Tu rakeback optimizado",
    description:
      "Plataforma integral para jugadores de poker online. Rakeback optimizado, herramientas, coaching y comunidad.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${cormorant.variable} ${jetbrainsMono.variable} h-full dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
