"use client";

import { GlobalSearch } from "./GlobalSearch";
import { useGlobalSearchShortcut } from "@/lib/hooks/useGlobalSearchShortcut";

export function GlobalSearchMount() {
  useGlobalSearchShortcut();
  return <GlobalSearch />;
}
