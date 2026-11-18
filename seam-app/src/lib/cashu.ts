import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

/**
 * Minimal Cashu layer.
 * - Demo mode: mints mock `cashuB...` tokens locally (no network, for judges with no sats).
 * - Real mode: lazy-loads @cashu/cashu-ts so the app boots offline and stays small.
 *   Real mint/melt uses the configured mint URL.
 */

const BALANCE_KEY = 'seam_cashu_balance';
const TOKENS_KEY = 'seam_cashu_tokens';

export interface CashuTokenRecord {
  token: string;
  amount: number;
  mint: string;
  memo?: string;
  createdAt: number;
}

export function isDemoMint(mintUrl: string): boolean {
  return mintUrl.startsWith('demo:');
}

function randomToken(amount: number, mint: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  const n = 96 + Math.floor(Math.random() * 64);
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `cashuBdemo1${s}`;
}

export async function getStoredBalance(): Promise<number> {
  const v = await AsyncStorage.getItem(BALANCE_KEY);
  return v ? parseInt(v, 10) || 0 : 0;
}

export async function getStoredTokens(): Promise<CashuTokenRecord[]> {
  const v = await AsyncStorage.getItem(TOKENS_KEY);
  try {
    return v ? (JSON.parse(v) as CashuTokenRecord[]) : [];
  } catch {
    return [];
  }
}

async function saveTokens(tokens: CashuTokenRecord[]) {
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  const total = tokens.reduce((a, t) => a + t.amount, 0);
  await AsyncStorage.setItem(BALANCE_KEY, String(total));
}

/** Demo mint: instantly create a mock token (offline capable). */
export async function demoMint(amount: number, mint: string, memo?: string): Promise<CashuTokenRecord> {
  const rec: CashuTokenRecord = {
    token: randomToken(amount, mint),
    amount,
    mint,
    memo,
    createdAt: Date.now(),
  };
  const all = await getStoredTokens();
  all.push(rec);
  await saveTokens(all);
  return rec;
}

/** Import a received token into local storage (no validation in MVP beyond prefix check). */
export async function importToken(token: string, mint: string, amountHint?: number): Promise<CashuTokenRecord> {
  const t = token.trim();
  if (!t.startsWith('cashuA') && !t.startsWith('cashuB')) {
    throw new Error('Not a Cashu token (expected cashuA… / cashuB…).');
  }
  // Amount is unknown without decoding; store as 0 and let real-mode decode fill it.
  // Amount is unknown without full keyset decode; use the hint when the caller knows it.
  let amount = amountHint ?? 0;
  if (!amount) {
    try {
      amount = decodeTokenAmount(t) ?? 0;
    } catch {
      amount = 0;
    }
  }
  const rec: CashuTokenRecord = { token: t, amount, mint, createdAt: Date.now() };
  const all = await getStoredTokens();
  all.push(rec);
  await saveTokens(all);
  return rec;
}

function decodeTokenAmount(token: string): number | null {
  // cashuB = base64url CBOR; try a lightweight JSON fallback some mints use in demos.
  try {
    const b64 = token.replace(/^cashuB/, '').replace(/^cashuA/, '');
    const norm = b64.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(norm, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    const proofs = obj?.token?.[0]?.proofs ?? obj?.proofs ?? [];
    if (Array.isArray(proofs)) {
      return proofs.reduce((a: number, p: any) => a + (p?.amount || 0), 0);
    }
  } catch {
    // ignore — real decode happens in real mode
  }
  return null;
}

/** Remove a token after it has been sent (sealed bearer semantics). */
export async function consumeToken(token: string): Promise<void> {
  const all = await getStoredTokens();
  await saveTokens(all.filter((t) => t.token !== token));
}

/** Seal a portion of spendable balance into a demo token for sending. */
export async function sealDemoToken(amount: number, mint: string, memo?: string): Promise<CashuTokenRecord> {
  // In demo mode we don't track proofs; just mint a fresh token of `amount`.
  return demoMint(amount, mint, memo);
}

// ---- Real mint/melt via lazy @cashu/cashu-ts v4 (only loaded when online + real mint) ----
// Wallet API: new Wallet(mintUrl, { unit }), loadMint(), createMintQuoteBolt11(amount)
// -> { quote, request }, mintProofsBolt11(amount, quote), getEncodedToken({ mint, proofs }).

/** Create a real Lightning mint quote: returns invoice the user must pay. */
export async function realCreateMintQuote(mintUrl: string, amount: number): Promise<{ request: string; quote: string }> {
  const { Wallet } = await import('@cashu/cashu-ts');
  const wallet = new Wallet(mintUrl, { unit: 'sat' });
  await wallet.loadMint();
  const q = await wallet.createMintQuoteBolt11(amount);
  return { request: q.request, quote: q.quote };
}

/** Check a mint quote then mint tokens; returns encoded token string. */
export async function realMintFromQuote(
  mintUrl: string,
  amount: number,
  quoteId: string,
): Promise<{ token: string; amount: number }> {
  const { Wallet, getEncodedToken } = await import('@cashu/cashu-ts');
  const wallet = new Wallet(mintUrl, { unit: 'sat' });
  await wallet.loadMint();
  const status = await wallet.checkMintQuoteBolt11(quoteId);
  if ((status as { state?: string }).state !== 'PAID') {
    throw new Error('Invoice not paid yet — pay it, then tap again.');
  }
  const proofs = await wallet.mintProofsBolt11(amount, quoteId);
  const token = getEncodedToken({ mint: mintUrl, proofs } as never);
  return { token, amount };
}

/** Create a melt quote for a Lightning invoice (full melt needs stored proofs — see NEXT.md). */
export async function realMelt(mintUrl: string, invoice: string): Promise<{ paid: boolean; txId?: string }> {
  const { Wallet } = await import('@cashu/cashu-ts');
  const wallet = new Wallet(mintUrl, { unit: 'sat' });
  await wallet.loadMint();
  // MVP: melt expects the wallet to already hold proofs; full proof management
  // is tracked in NEXT.md. For the hackathon demo we surface the mint's
  // quote honestly rather than faking success.
  const quote = await wallet.createMeltQuoteBolt11(invoice);
  return { paid: false, txId: (quote as { quote?: string })?.quote };
}
