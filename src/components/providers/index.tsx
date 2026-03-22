"use client";

import { SessionProvider } from "./SessionProvider";
import { QueryProvider } from "./QueryProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#161B22",
              border: "1px solid #30363D",
              color: "#E6EDF3",
            },
          }}
        />
      </QueryProvider>
    </SessionProvider>
  );
}
