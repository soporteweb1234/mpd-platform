export type SettlementInput = {
  profitLoss: number;
  makeupBefore: number;
  profitSplitMpd: number;
  profitSplitPlayer: number;
};

export type SettlementResult = {
  makeupAfter: number;
  mpdShare: number;
  playerShare: number;
};

export function computeSettlement(input: SettlementInput): SettlementResult {
  const pl = round2(input.profitLoss);
  const makeup = Math.max(0, round2(input.makeupBefore));
  const splitMpd = clampPct(input.profitSplitMpd);
  const splitPlayer = clampPct(input.profitSplitPlayer);

  if (pl <= 0) {
    return {
      makeupAfter: round2(makeup + Math.abs(pl)),
      mpdShare: 0,
      playerShare: 0,
    };
  }

  if (pl <= makeup) {
    return {
      makeupAfter: round2(makeup - pl),
      mpdShare: 0,
      playerShare: 0,
    };
  }

  const residual = pl - makeup;
  const total = splitMpd + splitPlayer;
  const mpdPct = total > 0 ? splitMpd / total : 0.35;
  const playerPct = total > 0 ? splitPlayer / total : 0.65;

  const mpdShare = round2(residual * mpdPct);
  const playerShare = round2(residual - mpdShare);

  return { makeupAfter: 0, mpdShare, playerShare };
}

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}
