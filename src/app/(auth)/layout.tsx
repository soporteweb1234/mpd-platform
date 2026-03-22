export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mpd-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mpd-gold flex items-center justify-center text-mpd-black font-bold">
              M
            </div>
            <span className="text-xl font-bold text-mpd-white">Manager Poker Deal</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
