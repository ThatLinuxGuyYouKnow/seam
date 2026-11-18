# Seam — Low-Bandwidth Cashu & Nostr Remittance Bridge
Dakar Bitcoin Hack 2026 (BTrust) — Bitcoin / Lightning / Nostr track.

## Problem
In areas with expensive data or spotty 3G/4G, regular Lightning wallets fail mid-payment.
Users need to move small amounts of sats even when the recipient is offline.

## Solution
Mobile-first app (Expo React Native, runs on Android/iOS/Web):
1. Online: swap sats Lightning <-> Cashu ecash tokens (compact bearer tokens, a few hundred bytes).
2. Send tokens anywhere text goes: encrypted Nostr DMs (NIP-17 gift-wrap), SMS, WhatsApp, or offline QR.
3. Recipient claims back to Lightning when they reconnect. Outbox queue retries Nostr sends.

## MVP scope (judge demo in 3 min)
- Onboarding: BIP39 seed + Nostr key, SecureStore, backup screen.
- Balances: Cashu (real mint via @cashu/cashu-ts) + Lightning (NWC) + Demo mock mode for judges with no sats.
- Mint (Lightning -> Cashu): create quote, show invoice / QR, poll, mint tokens.
- Melt (Cashu -> Lightning): paste invoice, melt.
- Send: pick amount -> sealed token -> [Nostr DM | QR | SMS/WhatsApp share].
- Receive: [Nostr inbox | paste token | scan QR] -> store -> melt or hold.
- Offline queue + low-bandwidth toggle (1 relay, no images, compact encoding).

## Stack
- Expo + React Native + TypeScript + Expo Router (Web compatible for one-command judge run)
- `@cashu/cashu-ts` v2, `nostr-tools` v2 (nip17/nip44/nip19, SimplePool), `bip39`, `@noble/hashes`, `bitcoinjs-lib` (testnet address gen)
- `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-camera` (QR scan), `react-native-qrcode-svg`, `expo-sharing` / `Share`, `@react-native-community/netinfo`
- No backend. Mints + public relays only.

## Defaults for demo
- Mint: `https://testnut.cashu.space` (testnet, no real funds). Configurable.
- Relays: `wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.nostr.band` (low-band mode: first only).
- Demo mode: mock mint + mock relay log so full flow works offline.

## One-command run
```bash
cd seam-app
npm install
npx expo start --web
# phone: npx expo start, scan QR with Expo Go
```

## Docs for submission
- `README.md` (setup, architecture diagram, constraints, metrics, next iteration)
- `DEMO.md` (3-min script: problem -> solution -> impact -> next)
- `THREAT-MODEL.md` (minimal)
