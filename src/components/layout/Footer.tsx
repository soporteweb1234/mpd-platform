import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { LEGAL_DISCLAIMER } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-mpd-surface border-t border-mpd-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo size="sm" />
            </div>
            <p className="text-sm text-mpd-gray">
              El jugador solo tiene que jugar al poker. Nosotros resolvemos todo lo demás.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-mpd-white mb-4">Plataforma</h4>
            <ul className="space-y-2">
              <li><Link href="/calculadora" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Calculadora Rakeback</Link></li>
              <li><Link href="/como-funciona" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Cómo Funciona</Link></li>
              <li><Link href="/servicios" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Servicios</Link></li>
              <li><Link href="/faq" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Preguntas Frecuentes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-mpd-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/legal/privacidad" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Política de Privacidad</Link></li>
              <li><Link href="/legal/terminos" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Términos y Condiciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-mpd-white mb-4">Comunidad</h4>
            <ul className="space-y-2">
              {/* TODO: Reemplazar [PENDING_URL] con URLs reales de Discord e Instagram */}
              <li><a href="[PENDING_URL]" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Discord</a></li>
              <li><a href="[PENDING_URL]" className="text-sm text-mpd-gray hover:text-mpd-gold transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-mpd-border mt-8 pt-8 space-y-4">
          <div className="space-y-2 max-w-4xl mx-auto text-[11px] leading-relaxed text-mpd-gray-dark">
            {LEGAL_DISCLAIMER.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <p className="text-sm text-mpd-gray-dark text-center">
            &copy; Manager Poker Deals 2026. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
