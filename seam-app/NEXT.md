# NEXT — post-hackathon iteration

1. **NWC Lightning wallet in-app** — connect Alby/LNbits via Nostr Wallet Connect
   (`nostr-tools` nip47): pay mint invoices without leaving the app; show Lightning balance.
2. **Persistent proof wallet** — store proofs per keyset (SQLite), select/swap on send,
   so live mode seals real tokens and **melt pays any invoice** end-to-end.
3. **P2PK-locked tokens** — lock to recipient npub; only their key claims (theft-safe SMS/QR).
4. **Relay health auto-pick** — latency probe, fastest relay in low-bandwidth mode; NIP-65 lists.
5. **i18n + UX** — Hausa/Wolof/French copy, bigger QRs, amounts in XOF₁ display.
6. **Merchant path** — static receive QR + claim-to-mobile-money note.
