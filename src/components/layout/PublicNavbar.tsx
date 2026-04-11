"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Calculadora", href: "/calculadora" },
  { label: "Cómo Funciona", href: "/como-funciona" },
  { label: "Servicios", href: "/servicios" },
  { label: "FAQ", href: "/faq" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-mpd-black/80 backdrop-blur-xl border-b border-mpd-border/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-mpd-gold flex items-center justify-center text-mpd-black font-bold text-sm">
            M
          </div>
          <span className="font-semibold text-mpd-white hidden sm:block">Manager Poker Deal</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors",
                pathname === link.href
                  ? "text-mpd-gold"
                  : "text-mpd-gray hover:text-mpd-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Únete</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-mpd-gray hover:text-mpd-white"
          aria-label="Menú"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-mpd-surface border-t border-mpd-border p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === link.href
                  ? "text-mpd-gold bg-mpd-gold/10"
                  : "text-mpd-gray hover:text-mpd-white hover:bg-mpd-surface-hover"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-mpd-border flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link href="/register">Únete</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
