// Global defaults for Seam — mint, relays, demo mode.
export const DEFAULT_MINT_URL = 'https://testnut.cashu.space';
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];
export const LOW_BANDWIDTH_RELAYS = ['wss://relay.damus.io'];

// Prefix used to tag Seam cashu transfers inside NIP-17 DMs.
export const SEAM_DM_PREFIX = 'seam:cashu:';
export const SEAM_DM_KIND_LABEL = 'Cashu token (Seam remittance)';

export function relaysFor(lowBandwidth: boolean, custom?: string[]): string[] {
  if (custom && custom.length > 0) return custom;
  return lowBandwidth ? LOW_BANDWIDTH_RELAYS : DEFAULT_RELAYS;
}
