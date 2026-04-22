"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHARE_COPY =
  "Juega al poker online con mejor rakeback, herramientas y coaching. Únete a Manager Poker Deal con mi referido:";

export function ReferralShareButtons({ url, code }: { url: string; code: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${SHARE_COPY} ${url}`);

  const waHref = `https://wa.me/?text=${encodedText}`;
  const tgHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(SHARE_COPY)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodedText}`;

  async function nativeShare() {
    if (typeof window === "undefined") return;
    const nav = window.navigator as unknown as {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
      clipboard?: { writeText: (t: string) => Promise<void> };
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({
          title: "Manager Poker Deal",
          text: SHARE_COPY,
          url,
        });
        return;
      } catch {
        return;
      }
    }
    if (nav.clipboard) {
      await nav.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        asChild
        aria-label="Compartir por WhatsApp"
      >
        <a href={waHref} target="_blank" rel="noreferrer noopener">
          <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        asChild
        aria-label="Compartir en Telegram"
      >
        <a href={tgHref} target="_blank" rel="noreferrer noopener">
          <Send className="h-3.5 w-3.5 mr-1" /> Telegram
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" asChild aria-label="Compartir en X">
        <a href={xHref} target="_blank" rel="noreferrer noopener">
          <Share2 className="h-3.5 w-3.5 mr-1" /> X / Twitter
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={nativeShare}>
        <Share2 className="h-3.5 w-3.5 mr-1" /> Compartir
      </Button>
      <span className="text-[10px] text-mpd-gray self-center">
        Código: <span className="font-mono">{code}</span>
      </span>
    </div>
  );
}
