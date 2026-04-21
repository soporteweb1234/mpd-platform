import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mpd-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>
        {children}
      </div>
    </div>
  );
}
