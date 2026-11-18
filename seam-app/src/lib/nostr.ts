import AsyncStorage from '@react-native-async-storage/async-storage';
import { SimplePool, nip17, nip19 } from 'nostr-tools';
import { SEAM_DM_PREFIX } from './config';
import { hexToBytes } from './identity';

const OUTBOX_KEY = 'seam_nostr_outbox';
const INBOX_KEY = 'seam_nostr_inbox';

export interface QueuedDM {
  id: string;
  toPubkey: string;
  message: string;
  relays: string[];
  createdAt: number;
  tries: number;
  status: 'queued' | 'sent' | 'failed';
}

export interface InboxMessage {
  id: string;
  fromPubkey: string;
  text: string;
  token?: string;
  receivedAt: number;
}

let pool: SimplePool | null = null;
function getPool(): SimplePool {
  if (!pool) pool = new SimplePool();
  return pool;
}

async function readOutbox(): Promise<QueuedDM[]> {
  const v = await AsyncStorage.getItem(OUTBOX_KEY);
  try {
    return v ? (JSON.parse(v) as QueuedDM[]) : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items: QueuedDM[]) {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

async function readInbox(): Promise<InboxMessage[]> {
  const v = await AsyncStorage.getItem(INBOX_KEY);
  try {
    return v ? (JSON.parse(v) as InboxMessage[]) : [];
  } catch {
    return [];
  }
}

async function writeInbox(items: InboxMessage[]) {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items));
}

/** Build NIP-17 gift-wraps for a Seam cashu DM (caller publishes or queues). */
export function buildSeamGiftWraps(skHex: string, toPubkey: string, token: string, memo?: string) {
  const sk = hexToBytes(skHex);
  const message = `${SEAM_DM_PREFIX}${token}${memo ? `\nMemo: ${memo}` : ''}`;
  const wraps = nip17.wrapManyEvents(sk, [{ publicKey: toPubkey }], message);
  return wraps;
}

/** Publish gift-wraps now; on failure, queue for retry. */
export async function sendSeamDM(
  skHex: string,
  toPubkey: string,
  token: string,
  relays: string[],
  memo?: string,
): Promise<{ published: number; queued: boolean }> {
  const wraps = buildSeamGiftWraps(skHex, toPubkey, token, memo);
  try {
    // publish() takes ONE event and returns one promise per relay — fan out over wraps.
    const pending: Promise<string>[] = wraps.flatMap((w) => getPool().publish(relays, w));
    const pubs = await Promise.allSettled(pending);
    const ok = pubs.filter((p) => p.status === 'fulfilled').length;
    if (ok > 0) return { published: ok, queued: false };
    throw new Error('all relays failed');
  } catch {
    const outbox = await readOutbox();
    outbox.push({
      id: `dm_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      toPubkey,
      message: `${SEAM_DM_PREFIX}${token}${memo ? `\nMemo: ${memo}` : ''}`,
      relays,
      createdAt: Date.now(),
      tries: 0,
      status: 'queued',
    });
    await writeOutbox(outbox);
    return { published: 0, queued: true };
  }
}

/** Retry all queued DMs (call on reconnect / app focus). */
export async function flushOutbox(skHex: string): Promise<{ sent: number; remaining: number }> {
  const sk = hexToBytes(skHex);
  const outbox = await readOutbox();
  let sent = 0;
  const remaining: QueuedDM[] = [];
  for (const item of outbox) {
    if (item.status === 'sent') continue;
    try {
      const wraps = nip17.wrapManyEvents(sk, [{ publicKey: item.toPubkey }], item.message);
      const pending: Promise<string>[] = wraps.flatMap((w) => getPool().publish(item.relays, w));
      const pubs = await Promise.allSettled(pending);
      const ok = pubs.some((p) => p.status === 'fulfilled');
      if (ok) {
        sent++;
      } else {
        remaining.push({ ...item, tries: item.tries + 1, status: 'failed' });
      }
    } catch {
      remaining.push({ ...item, tries: item.tries + 1, status: 'failed' });
    }
  }
  await writeOutbox(remaining);
  return { sent, remaining: remaining.length };
}

export async function getOutbox(): Promise<QueuedDM[]> {
  return readOutbox();
}

export async function getInbox(): Promise<InboxMessage[]> {
  return readInbox();
}

/** Poll gift-wraps addressed to us, unwrap NIP-17, and stash Seam tokens. */
export async function pollInbox(skHex: string, myPubkey: string, relays: string[]): Promise<InboxMessage[]> {
  const sk = hexToBytes(skHex);
  const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
  const events = await getPool().querySync(relays, { kinds: [1059], '#p': [myPubkey], since, limit: 50 });
  const prior = await readInbox();
  const seen = new Set(prior.map((m) => m.id));
  const fresh: InboxMessage[] = [];
  for (const ev of events) {
    try {
      const rumor = nip17.unwrapEvent(ev, sk);
      const text: string = rumor?.content ?? '';
      if (!text.includes(SEAM_DM_PREFIX)) continue;
      const id: string = rumor?.id ?? ev.id;
      if (seen.has(id)) continue;
      const tokenMatch = text.match(/cashu[AB][A-Za-z0-9\-_=+/]+/);
      fresh.push({
        id,
        fromPubkey: rumor?.pubkey ?? 'unknown',
        text,
        token: tokenMatch ? tokenMatch[0] : undefined,
        receivedAt: Date.now(),
      });
    } catch {
      continue;
    }
  }
  if (fresh.length > 0) {
    await writeInbox([...fresh, ...prior].slice(0, 100));
  }
  return [...fresh, ...prior].slice(0, 100);
}

export function formatNpub(pubkeyHex: string): string {
  try {
    return nip19.npubEncode(pubkeyHex).slice(0, 16) + '…';
  } catch {
    return pubkeyHex.slice(0, 12) + '…';
  }
}
