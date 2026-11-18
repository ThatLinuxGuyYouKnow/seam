# Seam app

Low-bandwidth / offline-ready Cashu + Nostr remittance bridge.
Expo SDK 58 · React Native + Web · TypeScript · Expo Router.

## Setup

```bash
npm install
npx expo start --web   # browser (judge-friendly, no phone needed)
npx expo start         # scan QR with Expo Go for Android/iOS
npx tsc --noEmit       # typecheck
npx expo lint          # lint
```

Defaults: mint `https://testnut.cashu.space` (testnet, no real funds),
relays `relay.damus.io, nos.lol, relay.nostr.band` (low-bandwidth mode: first only).

## Architecture

```
┌─────────────┐   Lightning invoice    ┌──────────────┐
│   Recipient │ ◄───────────────────── │  Cashu mint  │
│  Lightning  │     melt (claim)       │  (testnut)   │
└─────────────┘                        └──────┬───────┘
       ▲            mint (online)             │ blind sigs
       │                                      ▼
┌─────────────┐   seal token           ┌──────────────┐
│   Sender    │ ─────────────────────► │ bearer token │
│   phone     │   cashuB… (~200-400B)  │  (proofs)    │
└──────┬──────┘                        └──────────────┘
       │ send (works offline for recipient)
       ├── NIP-17 gift-wrapped DM ──► Nostr relays ──► recipient inbox (poll on reconnect)
       ├── QR ──► camera scan (expo-camera, offline)
       └── SMS / WhatsApp ──► Share / sms: / wa.me links
Outbox queue (AsyncStorage): failed DMs retry on reconnect.
Secrets: nsec in SecureStore (web: localStorage fallback). No PII in logs.
Demo mode: local mock mint, full flow with zero sats / zero network.
```

## Key files
- `index.js` — entry: Buffer polyfill, then `expo-router/entry`
- `src/app/_layout.tsx` — Stack + WalletProvider
- `src/app/index.tsx` — home: balances, outbox, demo path
- `src/app/mint.tsx` — Lightning → Cashu (demo instant / live invoice + QR)
- `src/app/send.tsx` — seal token → Nostr DM / QR / SMS / WhatsApp
- `src/app/receive.tsx` — Nostr inbox poll / paste token / QR scan / live melt
- `src/app/settings.tsx` — mint, relays, low-bandwidth toggle, backup
- `src/lib/cashu.ts`, `src/lib/nostr.ts`, `src/lib/identity.ts`, `src/lib/config.ts`
- `src/store/wallet.tsx` — balances, tokens, prefs (AsyncStorage)

## Constraints (honest)
- Live melt needs wallet proof management — MVP surfaces the quote, full melt in `NEXT.md`.
- Real mint quotes need network + a funded Lightning invoice; Demo mode covers judges offline.
- NIP-17 inbox polling is pull-based; push notifications are out of scope.
- SMS costs a carrier message; tokens fit in 1–2 segments (~200–400 chars base64url).

## Metrics to track next
- Mint success rate & time-to-mint on 3G; DM delivery latency per relay;
- QR scan success in low light; outbox retry success on reconnect;
- tokens claimed vs expired; weekly active senders/recipients.

## Next iteration
See `NEXT.md`: NWC Lightning connection, persistent proof wallet + full melt,
P2PK-locked tokens, relay health auto-pick, Hausa/Wolof/French copy.
