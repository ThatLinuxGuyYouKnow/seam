import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

const NSEC_KEY = 'seam_nsec';
const BACKUP_KEY = 'seam_mnemonic_backup_note';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return await AsyncStorage.getItem(key);
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      await AsyncStorage.setItem(key, value);
      return;
    }
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

export interface Identity {
  /** 32-byte hex secret key */
  skHex: string;
  /** 32-byte hex public key */
  pkHex: string;
  /** bech32 nsec (backup) */
  nsec: string;
  /** bech32 npub (shareable address) */
  npub: string;
}

/** Load or create the device Nostr identity. Never logs the secret. */
export async function getOrCreateIdentity(): Promise<Identity> {
  const existing = await secureGet(NSEC_KEY);
  if (existing) {
    const sk = nip19.decode(existing);
    if (sk.type === 'nsec') {
      const skHex = bytesToHex(sk.data);
      const pkHex = getPublicKey(sk.data);
      return { skHex, pkHex, nsec: existing, npub: nip19.npubEncode(pkHex) };
    }
  }
  const sk = generateSecretKey();
  const nsec = nip19.nsecEncode(sk);
  await secureSet(NSEC_KEY, nsec);
  const skHex = bytesToHex(sk);
  const pkHex = getPublicKey(sk);
  return { skHex, pkHex, nsec, npub: nip19.npubEncode(pkHex) };
}

export function npubToHex(npubOrHex: string): string | null {
  const v = npubOrHex.trim();
  if (/^[0-9a-f]{64}$/i.test(v)) return v.toLowerCase();
  try {
    if (v.startsWith('npub1')) {
      const d = nip19.decode(v);
      if (d.type === 'npub') return d.data;
    }
    if (v.startsWith('nostr:')) {
      const d = nip19.decode(v.slice(6));
      if (d.type === 'npub') return d.data;
    }
  } catch {
    return null;
  }
  return null;
}

export { hexToBytes, bytesToHex };
export async function setBackupNote(note: string) {
  await AsyncStorage.setItem(BACKUP_KEY, note);
}
