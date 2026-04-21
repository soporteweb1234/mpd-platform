import { generateSecret as otpGenerateSecret, generateURI, verify as otpVerify } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ISSUER = "Manager Poker Deal";

export function generateSecret(): string {
  return otpGenerateSecret();
}

export async function qrCodeDataUrl(
  email: string,
  secret: string,
): Promise<string> {
  const otpauth = generateURI({ issuer: ISSUER, label: email, secret });
  return QRCode.toDataURL(otpauth);
}

export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const result = await otpVerify({ token, secret, epochTolerance: 30 });
  return result.valid;
}

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
}

export async function verifyBackupCode(
  input: string,
  hashes: string[],
): Promise<{ valid: boolean; remaining: string[] }> {
  const normalized = input.trim().toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    const match = await bcrypt.compare(normalized, hashes[i]);
    if (match) {
      const remaining = [...hashes.slice(0, i), ...hashes.slice(i + 1)];
      return { valid: true, remaining };
    }
  }
  return { valid: false, remaining: hashes };
}
