# Seam

Low bandwidth Cashu and Nostr remittance that keeps moving when the network does not.

## Inspiration

In Lagos and Kano, the pattern is normal: power cuts at 9pm, phone on one bar, a market sale stuck because a Lightning payment fails halfway and the sats are in limbo. Data is expensive, 3G drops, and buying or selling with crypto still assumes everyone is online at the same time. We wanted money that behaves like cash. Hand it over now, settle later. That is what Seam is: swap Lightning into compact Cashu tokens when you have signal, then send them anywhere text can go, even with zero bars.

## What it does

Seam is a mobile first remittance app built for the Dakar Bitcoin Hack 2026.

1. Top up: swap sats from Lightning into Cashu ecash bearer tokens (a few hundred bytes each) while online.
2. Send offline: seal an amount into a token and hand it over as an encrypted Nostr DM (NIP-17 gift wrap), SMS or WhatsApp text, or an offline QR code. The recipient needs zero internet to receive it.
3. Claim later: the recipient pastes or scans the token and melts it back to Lightning when reconnected.
4. Offline outbox: failed Nostr sends queue locally in AsyncStorage and retry on reconnect. Low bandwidth mode uses one relay and no images.

Demo mode is ON by default, so judges can run Mint 100, Seal 50, show the live QR, and claim it back with zero sats and fully offline. Turn demo off in Settings for real Lightning invoices against a test mint.

## How we built it

One codebase for Android, iOS, and web: Expo SDK 58 with TypeScript and Expo Router, no backend, only mints plus public relays.

- Cashu: `@cashu/cashu-ts` v4 with a real testnut mint path plus an offline demo mock so judging never depends on funds or signal. Live melt is quote only in the MVP.
- Nostr: `nostr-tools` NIP-17 gift wrap send, inbox poll with a 7 day window, and an offline outbox queue. Verified live with a wrap and unwrap round trip against `wss://nos.lol` and `wss://relay.primal.net` (4 of 4 publishes acked).
- Identity: device Nostr key in SecureStore, balance and outbox in AsyncStorage.
- Screens: Home, Mint, Send, Receive, Settings, all in Expo Router.
- Demo video: HyperFrames 1920x1080 composition with a Deepgram voiceover, driving a real Playwright screen recording of the app inside a CSS phone frame with no notch.

Checks are clean: `tsc --noEmit`, `expo lint`, `expo export` for web, and `expo-doctor` 20 of 20.

## Challenges we ran into

- `relay.damus.io` returned HTTP 503 to WebSocket upgrades from our network, so low bandwidth single relay mode had to fail soft into the outbox instead of hard failing. We kept `nos.lol` as the reliable default.
- Our Node test harness hit an undici and `nostr-tools` stack overflow that looked like a library bug. It was test only. The same NIP-17 path passes on device and in the app networking stack.
- Expo web boot broke when a stale template entry (`index.ts`, `App.tsx`) shadowed the router. We deleted the stale entries and rewrote `index.js` as valid JS with a Buffer polyfill.
- Disk was tight (about 2.5GB free), so caches had to be cleared between renders.
- Video timing: a 53 second screen recording plus a 53 second voiceover in a 54 second composition left no room for slides during the demo. We split it into three acts (problem slides, clean phone only demo, payoff slides) and used a media offset to play the best 30 seconds of the drive (home 0 to Mint 100 to Seal 50 QR to Receive).

## Accomplishments that we're proud of

- A working MVP that runs end to end with no sats and no signal in demo mode, plus real invoices in live mode.
- Live verified Nostr DMs, not mocked: NIP-17 round trip OK, outbox retry included.
- A 54 second demo video that is all real UI. No redrawn mockups, no cropped panels, no text over the app. Slides only frame the demo, never cover it.
- Full docs for judges: one command run, 3 minute demo script, architecture, threat model, and next steps.

## What we learned

- Offline first changes the design. Queues, bearer tokens, and claim later flows matter more than live payment speed when signal is the exception.
- One relay is a feature for low bandwidth, but only with honest failure handling. The outbox is the product, not the error toast.
- Small tokens win. A few hundred bytes fit in SMS, WhatsApp, and QR, which is the whole point when data is the bottleneck.
- For demo video, the app recording is the story. Cut everything around it until the Mint and Seal proof beats land inside the frame.

## What's next for Seam

- NWC wallet connection (Alby, LNbits) so Lightning lives in app.
- Persistent proof wallet plus one tap melt to any invoice.
- P2PK locked tokens so only the recipient key can claim.
- Relay health auto pick plus Hausa, Wolof, and French copy for the markets we are building for.
