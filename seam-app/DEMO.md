# 3-minute demo script (problem → solution → impact → next)

## 0:00–0:30 Problem
“In many places data is expensive and 3G drops. A normal Lightning payment fails
halfway and the money is stuck. Show a phone with 1 bar / offline toggle.”

## 0:30–1:30 Solution (live, Demo ON — zero sats, can be offline)
1. Home: 0 sats. Go to **Mint**, enter 100 → Mint (demo) → balance 100.
2. Go to **Send**, amount 50, memo “transport” → Seal token.
3. Show the QR + copy the text — “this fits in an SMS; the recipient needs no internet.”
4. Go to **Receive** → paste the token → claim. Balance updates.
5. (If online) Settings → Demo OFF → Mint → show a **real Lightning invoice + QR**
   against testnut, pay from any wallet, Check & mint.

## 1:30–2:15 Impact
- Works on the cheapest Android phones, web fallback for judges with no phone.
- One relay in low-bandwidth mode; ~300-byte tokens ride SMS/WhatsApp/QR.
- Outbox queue: failed Nostr DMs retry on reconnect (show Outbox on Home).
- Local use case: market sellers, transport fares, family remittances in Dakar.

## 2:15–3:00 Next steps
- NWC wallet connection (Alby/LNbits) so Lightning lives in-app.
- Persistent proof wallet + one-tap melt to any invoice.
- P2PK-locked tokens (only the recipient’s key can claim).
- Relay health auto-pick + Hausa/Wolof/French copy. See NEXT.md.
