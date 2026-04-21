export const WALLET_KEYS = [
  "wallet.usdt.erc20",
  "wallet.usdt.trc20",
  "wallet.usdt.bep20",
] as const;

export type WalletKey = (typeof WALLET_KEYS)[number];

export type WalletSettings = Record<WalletKey, string>;
