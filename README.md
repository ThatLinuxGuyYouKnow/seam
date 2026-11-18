# Seam — Low-Bandwidth Cashu & Nostr Remittance Bridge

**Dakar Bitcoin Hack 2026 (BTrust)** · Bitcoin / Lightning / Nostr track

## Problem
In areas with expensive data or spotty 3G/4G, regular Lightning wallets fail mid-payment.
People need to move small amounts of sats even when the recipient is **offline**.

## Solution
Mobile-first app (Expo React Native — Android / iOS / web from one codebase):

1. **Online:** swap sats Lightning → compact Cashu ecash bearer tokens (a few hundred bytes).
2. **Send:** hand the token over encrypted Nostr DMs (NIP-17 gift-wrap), SMS, WhatsApp text,
   or an offline QR code — recipient needs **zero internet**.
3. **Claim:** recipient imports the token and melts it back to Lightning when reconnected.
   Failed Nostr sends wait in an **offline outbox** and retry on reconnect.

## One-command run
```bash
cd seam-app
npm install
npx expo start --web   # judges: runs in the browser, no phone needed
# or on a phone: npx expo start, scan the QR with Expo Go
```

Demo mode is **ON by default** — the full flow works with zero sats, offline.
Turn it off in Settings for live Lightning invoices against a real test mint.

## Repo layout
- `seam-app/` — the Expo app (source in `src/`, routes in `src/app/`)
  - `src/lib/cashu.ts` — Cashu mint/melt (demo + real `@cashu/cashu-ts` v4)
  - `src/lib/nostr.ts` — NIP-17 DMs, inbox, offline outbox queue
  - `src/lib/identity.ts` — device Nostr identity in SecureStore
  - `src/app/` — Home, Mint, Send, Receive, Settings (Expo Router)
- `ARCHITECTURE.md` — MVP scope & stack
- `seam-app/README.md` — setup, architecture, constraints, metrics, next steps
- `seam-app/DEMO.md` — 3-minute demo script
- `seam-app/THREAT-MODEL.md` — minimal attack surface, secret handling
- `seam-app/NEXT.md` — what ships in the next iteration

## Requirement coverage
- **Bitcoin/Lightning wallet:** on-device identity + live mint/melt quotes against a real
  Cashu mint (Lightning under the hood) + NWC tracked as next step (`NEXT.md`).
- **Working MVP:** demo mode runs end-to-end offline; live mode shows real invoices.
- **Open source:** everything here is FOSS, MIT where we wrote it.
