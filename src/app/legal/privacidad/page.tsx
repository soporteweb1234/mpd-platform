import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Política de Privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-invert">
          <h1 className="text-3xl font-bold text-mpd-white">Política de Privacidad</h1>
          <p className="text-mpd-gray text-sm">Última actualización: Marzo 2026</p>
          <div className="mt-8 space-y-6 text-mpd-gray text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">1. Responsable del Tratamiento</h2>
              <p>Manager Poker Deal es responsable del tratamiento de los datos personales recogidos a través de esta plataforma.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">2. Datos que Recopilamos</h2>
              <p>Recopilamos los siguientes datos personales: nombre, email, país, nivel de juego, datos de actividad en salas de poker afiliadas, e información de tu cuenta de Discord si la vinculas.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">3. Finalidad del Tratamiento</h2>
              <p>Utilizamos tus datos para: gestionar tu cuenta, calcular y abonar tu rakeback, prestarte servicios contratados, enviarte notificaciones relevantes y mejorar tu experiencia en la plataforma.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">4. Base Legal</h2>
              <p>El tratamiento de tus datos se basa en la ejecución del contrato de servicio y tu consentimiento explícito al registrarte.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">5. Derechos del Usuario</h2>
              <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición contactándonos a través del soporte de la plataforma.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-mpd-white">6. Seguridad</h2>
              <p>Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo cifrado de contraseñas, conexiones seguras y acceso restringido.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
