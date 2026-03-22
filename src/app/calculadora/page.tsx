import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { RakebackCalculator } from "@/components/sections/Calculator";

export const metadata = {
  title: "Calculadora de Rakeback",
  description: "Calcula cuánto rakeback puedes ganar con Manager Poker Deal. Compara tu situación actual con nuestras condiciones.",
};

export default function CalculadoraPage() {
  return (
    <div className="min-h-screen bg-mpd-black">
      <PublicNavbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-mpd-white">Calculadora de Rakeback</h1>
            <p className="mt-2 text-mpd-gray">Descubre cuánto podrías ganar con Manager Poker Deal</p>
            <div className="mt-3 h-0.5 w-12 bg-mpd-gold rounded-full mx-auto" />
          </div>
          <RakebackCalculator />
        </div>
      </main>
      <Footer />
    </div>
  );
}
