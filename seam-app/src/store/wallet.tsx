import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateIdentity, type Identity } from '../lib/identity';
import { getStoredBalance, getStoredTokens, type CashuTokenRecord } from '../lib/cashu';
import { DEFAULT_MINT_URL, DEFAULT_RELAYS } from '../lib/config';

interface WalletState {
  ready: boolean;
  identity: Identity | null;
  cashuBalance: number;
  tokens: CashuTokenRecord[];
  mintUrl: string;
  setMintUrl: (u: string) => void;
  relays: string[];
  setRelays: (r: string[]) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (v: boolean) => void;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WalletState | null>(null);

const MINT_KEY = 'seam_mint_url';
const RELAYS_KEY = 'seam_relays';
const LOWBW_KEY = 'seam_lowbw';
const DEMO_KEY = 'seam_demo';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [cashuBalance, setCashuBalance] = useState(0);
  const [tokens, setTokens] = useState<CashuTokenRecord[]>([]);
  const [mintUrl, setMintUrlState] = useState(DEFAULT_MINT_URL);
  const [relays, setRelaysState] = useState<string[]>(DEFAULT_RELAYS);
  const [lowBandwidth, setLowBandwidthState] = useState(true);
  const [demoMode, setDemoModeState] = useState(true);

  const refresh = useCallback(async () => {
    const [b, t] = await Promise.all([getStoredBalance(), getStoredTokens()]);
    setCashuBalance(b);
    setTokens(t);
  }, []);

  useEffect(() => {
    (async () => {
      const [id, m, r, lb, dm] = await Promise.all([
        getOrCreateIdentity(),
        AsyncStorage.getItem(MINT_KEY),
        AsyncStorage.getItem(RELAYS_KEY),
        AsyncStorage.getItem(LOWBW_KEY),
        AsyncStorage.getItem(DEMO_KEY),
      ]);
      setIdentity(id);
      if (m) setMintUrlState(m);
      if (r) {
        try {
          const arr = JSON.parse(r);
          if (Array.isArray(arr) && arr.length > 0) setRelaysState(arr);
        } catch {}
      }
      if (lb !== null) setLowBandwidthState(lb === '1');
      // Default to demo ON unless explicitly turned off — judges can test with zero funds.
      if (dm !== null) setDemoModeState(dm === '1');
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const setMintUrl = useCallback((u: string) => {
    setMintUrlState(u);
    AsyncStorage.setItem(MINT_KEY, u);
  }, []);
  const setRelays = useCallback((r: string[]) => {
    setRelaysState(r);
    AsyncStorage.setItem(RELAYS_KEY, JSON.stringify(r));
  }, []);
  const setLowBandwidth = useCallback((v: boolean) => {
    setLowBandwidthState(v);
    AsyncStorage.setItem(LOWBW_KEY, v ? '1' : '0');
  }, []);
  const setDemoMode = useCallback((v: boolean) => {
    setDemoModeState(v);
    AsyncStorage.setItem(DEMO_KEY, v ? '1' : '0');
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      ready,
      identity,
      cashuBalance,
      tokens,
      mintUrl,
      setMintUrl,
      relays,
      setRelays,
      lowBandwidth,
      setLowBandwidth,
      demoMode,
      setDemoMode,
      refresh,
    }),
    [ready, identity, cashuBalance, tokens, mintUrl, relays, lowBandwidth, demoMode, refresh, setMintUrl, setRelays, setLowBandwidth, setDemoMode],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWallet must be used inside WalletProvider');
  return v;
}
