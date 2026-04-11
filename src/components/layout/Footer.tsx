import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-mpd-surface border-t border-mpd-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-mpd-gold flex items-center justify-center text-mpd-black font-bold text-sm">
                M
              </div>
              <span className="font-semibold text-mpd-white">Manager Poker Deal</span>
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
        <div className="border-t border-mpd-border mt-8 pt-8 text-center">
          <p className="text-sm text-mpd-gray-dark">&copy; Manager Poker Deal 2026. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
