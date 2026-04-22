export const WALLET_KEYS = [
  "wallet.usdt.erc20",
  "wallet.usdt.trc20",
  "wallet.usdt.bep20",
] as const;

export type WalletKey = (typeof WALLET_KEYS)[number];

export type WalletSettings = Record<WalletKey, string>;

export const WITHDRAWAL_NETWORKS = ["ERC20", "TRC20", "BEP20"] as const;
export type WithdrawalNetwork = (typeof WITHDRAWAL_NETWORKS)[number];

export const WITHDRAWAL_FEES: Record<WithdrawalNetwork, number> = {
  ERC20: 15,
  TRC20: 1,
  BEP20: 0.5,
};

export const WITHDRAWAL_MIN_USD = 20;

export const NETWORK_LABELS: Record<WithdrawalNetwork, string> = {
  ERC20: "Tether ERC20 (Ethereum)",
  TRC20: "Tether TRC20 (Tron)",
  BEP20: "Tether BEP20 (BSC)",
};
