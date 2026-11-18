# Threat model (minimal attack surface)

## Assets
- Device Nostr secret (nsec) — reads DMs, sends DMs as you.
- Cashu bearer tokens — whoever holds one can spend it.
- (Future) NWC connection string — can move Lightning funds.

## Trust assumptions
- Cashu mint is custodial for the token balance (standard ecash tradeoff).
  Users hold small amounts; testnet mint by default.
- Nostr relays see gift-wrap envelopes (metadata) but not DM contents (NIP-17/NIP-44).

## Mitigations in this MVP
- nsec generated on-device (`nostr-tools` RNG), stored in SecureStore
  (web fallback: localStorage — flagged in Settings as less secure).
- nsec never logged, never committed; backup screen warns before revealing.
- Token amounts validated by prefix (`cashuA`/`cashuB`); unknown tokens rejected.
- No PII in logs; memos are user-typed and travel with the token by design.
- Bear-cash warning shown on Home + Send: “send only to the right person.”
- `.gitignore` covers `devpost/learner-profile.md`-style personal files; no secrets in repo.

## Out of scope / residual risk (see NEXT.md)
- No PIN/biometric gate on send yet — add before mainnet amounts.
- No P2PK locks yet — lost/stolen token text is spendable by anyone.
- SecureStore web fallback is XSS-readable — web is a demo surface, not a vault.
