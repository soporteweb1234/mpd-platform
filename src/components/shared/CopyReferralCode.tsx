"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyReferralCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/ref/${code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="px-3 py-2 rounded-lg bg-mpd-black text-mpd-gold text-sm font-mono border border-mpd-border">
        {code}
      </code>
      <Button variant="outline" size="icon" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 text-mpd-green" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
