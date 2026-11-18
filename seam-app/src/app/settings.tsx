import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Btn, Card, COLORS, Screen, Sub, Title } from '../components/ui';
import { DEFAULT_MINT_URL, DEFAULT_RELAYS } from '../lib/config';
import { useWallet } from '../store/wallet';

export default function SettingsScreen() {
  const w = useWallet();
  const [mint, setMint] = useState('');
  const [relayText, setRelayText] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Title>Settings & backup</Title>
        <Sub>Low-bandwidth defaults are ON: one relay, compact tokens, offline-first queue.</Sub>

        <Card>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Demo mode (no sats needed)</Text>
              <Sub>Instant offline minting for judges & field tests.</Sub>
            </View>
            <Switch value={w.demoMode} onValueChange={w.setDemoMode} trackColor={{ true: COLORS.gold }} />
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Low-bandwidth mode</Text>
              <Sub>Single relay, minimal polling, no images.</Sub>
            </View>
            <Switch value={w.lowBandwidth} onValueChange={w.setLowBandwidth} trackColor={{ true: COLORS.gold }} />
          </View>
        </Card>

        <Card>
          <Text style={s.rowTitle}>Cashu mint</Text>
          <Sub>Current: {w.mintUrl}</Sub>
          <TextInput
            value={mint}
            onChangeText={setMint}
            placeholder={DEFAULT_MINT_URL}
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            style={s.input}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Btn
                label="Save mint"
                onPress={() => {
                  if (mint.trim()) {
                    w.setMintUrl(mint.trim());
                    setMint('');
                    setMsg('Mint saved.');
                  }
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Btn label="Reset" kind="ghost" onPress={() => w.setMintUrl(DEFAULT_MINT_URL)} />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={s.rowTitle}>Nostr relays</Text>
          <Sub>One per line. Current: {w.relays.length}</Sub>
          <TextInput
            value={relayText}
            onChangeText={setRelayText}
            placeholder={DEFAULT_RELAYS.join('\n')}
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            multiline
            style={[s.input, { minHeight: 80 }]}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Btn
                label="Save relays"
                onPress={() => {
                  const list = relayText.split('\n').map((l) => l.trim()).filter(Boolean);
                  if (list.length > 0) {
                    w.setRelays(list);
                    setRelayText('');
                    setMsg('Relays saved.');
                  }
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Btn label="Reset" kind="ghost" onPress={() => w.setRelays(DEFAULT_RELAYS)} />
            </View>
          </View>
          {msg !== '' && <Sub>{msg}</Sub>}
        </Card>

        <Card>
          <Text style={s.rowTitle}>Identity backup (sensitive)</Text>
          <Sub>Your Nostr key + npub. Anyone with the nsec can read your DMs. Never log it or commit it.</Sub>
          <Text style={s.mono} selectable>
            npub: {w.identity?.npub}
          </Text>
          <Text style={s.mono} selectable>
            nsec: {w.identity?.nsec.slice(0, 24)}… (tap reveal to copy full)
          </Text>
          <Btn
            label="Copy npub (shareable address)"
            kind="ghost"
            onPress={() => w.identity && Clipboard.setStringAsync(w.identity.npub)}
          />
          <Btn
            label="Copy nsec (private backup)"
            kind="ghost"
            onPress={() => w.identity && Clipboard.setStringAsync(w.identity.nsec)}
          />
        </Card>

        <Card>
          <Text style={s.rowTitle}>Lightning wallet (NWC — next step)</Text>
          <Sub>
            This MVP implements the required wallet surface as: on-device Cashu ecash + Nostr identity + live
            mint/melt quotes against a real mint. Full NWC connection string support (Alby/LNbits) is tracked in
            NEXT.md as the first post-hackathon step.
          </Sub>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  input: {
    backgroundColor: '#0B0B0F',
    borderWidth: 1,
    borderColor: '#2B2B36',
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  mono: { color: COLORS.muted, fontSize: 11 },
});
