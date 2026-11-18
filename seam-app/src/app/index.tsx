import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Card, COLORS, Screen, Sub, Title } from '../components/ui';
import { relaysFor } from '../lib/config';
import { flushOutbox, getOutbox } from '../lib/nostr';
import { useWallet } from '../store/wallet';

export default function Home() {
  const w = useWallet();
  const [queued, setQueued] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const [flushMsg, setFlushMsg] = useState('');

  const loadQueue = async () => {
    const q = await getOutbox();
    setQueued(q.length);
  };

  useEffect(() => {
    let cancelled = false;
    getOutbox().then(
      (q) => {
        if (!cancelled) setQueued(q.length);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [w.ready]);

  const onRetry = async () => {
    if (!w.identity) return;
    setFlushing(true);
    setFlushMsg('');
    try {
      const r = await flushOutbox(w.identity.skHex);
      setFlushMsg(r.sent > 0 ? `Sent ${r.sent} queued DM(s).` : 'Still offline — kept in queue.');
      await loadQueue();
    } catch (e: any) {
      setFlushMsg(e?.message ?? 'Retry failed.');
    } finally {
      setFlushing(false);
    }
  };

  if (!w.ready) {
    return (
      <Screen>
        <Title>Seam</Title>
        <Sub>Starting wallet…</Sub>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Title>Seam · low-bandwidth remittance</Title>
        <Sub>
          Lightning in → Cashu ecash out → send over Nostr DM, SMS, WhatsApp or offline QR. Recipient claims
          back to Lightning when reconnected.
        </Sub>

        <Card>
          <Text style={s.balanceLabel}>Cashu balance {w.demoMode ? '(demo)' : ''}</Text>
          <Text style={s.balance}>{w.cashuBalance} sats</Text>
          <Text style={s.mono} numberOfLines={1}>
            {w.tokens.length} token(s) · {w.mintUrl.replace('https://', '')}
          </Text>
          <Text style={s.mono} numberOfLines={1}>
            npub: {w.identity?.npub.slice(0, 20)}…
          </Text>
        </Card>

        <Card>
          <Text style={s.rowTitle}>Outbox</Text>
          <Sub>
            {queued === 0
              ? 'No queued Nostr DMs. Failed sends wait here until you reconnect.'
              : `${queued} Nostr DM(s) queued — tap retry when you have signal.`}
          </Sub>
          {queued > 0 && <Btn label={flushing ? 'Retrying…' : 'Retry queued sends'} onPress={onRetry} disabled={flushing} />}
          {flushMsg !== '' && <Sub>{flushMsg}</Sub>}
        </Card>

        <View style={{ gap: 8 }}>
          <Link href="/mint" asChild>
            <Btn label="1 · Top up: Lightning → Cashu" onPress={() => {}} />
          </Link>
          <Link href="/send" asChild>
            <Btn label="2 · Send offline (DM / QR / SMS)" onPress={() => {}} kind="ghost" />
          </Link>
          <Link href="/receive" asChild>
            <Btn label="3 · Receive / claim" onPress={() => {}} kind="ghost" />
          </Link>
          <Link href="/settings" asChild>
            <Btn label="Settings, relays & backup" onPress={() => {}} kind="ghost" />
          </Link>
        </View>

        <Card>
          <Text style={s.rowTitle}>How the demo flows (3 min)</Text>
          <Sub>
            1. Keep Demo ON in Settings (no sats needed).{'\n'}2. Mint → create 100 sats Cashu.{'\n'}
            3. Send → seal token → show QR + copy text for SMS/WhatsApp.{'\n'}4. Receive → paste token on a
            second device (or same app) → balance updates.{'\n'}5. Toggle Demo OFF + set a real test mint to
            show a live Lightning invoice.
          </Sub>
          <Sub>Relays: {relaysFor(w.lowBandwidth, w.relays).join(', ')}</Sub>
        </Card>

        <Text style={{ color: COLORS.muted, fontSize: 11, textAlign: 'center' }}>
          Bearer ecash: whoever holds the token can spend it. Send only to the right person.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  balanceLabel: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  balance: { color: COLORS.gold, fontSize: 40, fontWeight: '800' },
  mono: { color: COLORS.muted, fontSize: 11 },
  rowTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
});
