import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Términos y Condiciones" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-mpd-white">Términos y Condiciones</h1>
          <p className="text-mpd-gray text-sm mt-1">Última actualización: Marzo 2026</p>
          <div className="mt-8 space-y-6 text-mpd-gray text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">1. Objeto</h2>
              <p>Estos términos regulan el uso de la plataforma Manager Poker Deal y los servicios asociados.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">2. Registro</h2>
              <p>Para usar la plataforma debes crear una cuenta proporcionando información veraz. Eres responsable de mantener la confidencialidad de tus credenciales.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">3. Servicios</h2>
              <p>MPD actúa como intermediario de afiliación entre jugadores y salas de poker. El rakeback se calcula según las condiciones de cada sala y el estrato del jugador.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">4. Saldo Interno</h2>
              <p>El saldo interno es un crédito canjeable por servicios dentro del ecosistema MPD. No constituye dinero electrónico ni tiene valor fuera de la plataforma salvo solicitud expresa de retiro.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">5. Responsabilidad</h2>
              <p>MPD no es responsable de las decisiones de juego del usuario ni de los resultados en las salas de poker. El usuario es responsable de cumplir la legislación local respecto al juego online.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">6. Prohibiciones</h2>
              <p>Está prohibido el uso fraudulento de la plataforma, la creación de múltiples cuentas, y cualquier actividad que viole los términos de las salas de poker afiliadas.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
