import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Btn, Card, COLORS, Screen, Sub, Title } from '../components/ui';
import { consumeToken, sealDemoToken } from '../lib/cashu';
import { relaysFor } from '../lib/config';
import { npubToHex } from '../lib/identity';
import { sendSeamDM } from '../lib/nostr';
import { useWallet } from '../store/wallet';

export default function SendScreen() {
  const w = useWallet();
  const [amount, setAmount] = useState('50');
  const [memo, setMemo] = useState('');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');

  const sats = parseInt(amount, 10) || 0;
  const shareText = (t: string) =>
    `Seam remittance: ${sats} sats Cashu token${memo ? ` (${memo})` : ''}\n${t}\n\nOpen Seam → Receive to claim. Bearer cash — keep private.`;

  const seal = async (): Promise<string | null> => {
    if (sats <= 0) {
      setMsg('Enter an amount above 0.');
      return null;
    }
    if (!w.demoMode && w.cashuBalance < sats) {
      setMsg('In live mode this MVP seals from demo balance only — mint demo tokens first or see NEXT.md.');
      return null;
    }
    setBusy(true);
    setMsg('');
    try {
      const mint = w.demoMode ? `demo:${w.mintUrl}` : w.mintUrl;
      const rec = await sealDemoToken(sats, mint, memo || undefined);
      await consumeToken(rec.token).catch(() => {});
      // Re-add as "sealed, handed out" — keep balance simple: remove from spendable by
      // consuming then NOT re-adding. sealDemoToken added it; consume removed it.
      await w.refresh();
      setToken(rec.token);
      setMsg(`Sealed ${rec.amount} sats. Send the text or QR below — no internet needed by the recipient.`);
      return rec.token;
    } catch (e: any) {
      setMsg(e?.message ?? 'Seal failed.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onNostrSend = async () => {
    let t = token;
    if (!t) {
      const sealed = await seal();
      if (!sealed) return;
      t = sealed;
    }
    const hex = npubToHex(recipient);
    if (!hex) {
      setMsg('Enter a valid recipient npub (or 64-hex pubkey). Token is sealed below — QR/SMS still works.');
      return;
    }
    if (!w.identity) return;
    setBusy(true);
    try {
      const r = await sendSeamDM(w.identity.skHex, hex, t, relaysFor(w.lowBandwidth, w.relays), memo || undefined);
      setMsg(
        r.queued
          ? 'No relay reachable — DM queued in Outbox. It sends automatically on reconnect.'
          : `Sent over Nostr to ${recipient.slice(0, 18)}… (${r.published} relay(s)).`,
      );
    } catch (e: any) {
      setMsg(e?.message ?? 'Nostr send failed.');
    } finally {
      setBusy(false);
    }
  };

  const onShare = async (channel: 'sms' | 'whatsapp' | 'any') => {
    let t = token;
    if (!t) {
      const sealed = await seal();
      if (!sealed) return;
      t = sealed;
    }
    const text = shareText(t);
    try {
      if (channel === 'sms') {
        await Linking.openURL(`sms:?body=${encodeURIComponent(text)}`);
      } else if (channel === 'whatsapp') {
        await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
      } else {
        await Share.share({ message: text });
      }
    } catch (e: any) {
      setMsg(`Share failed: ${e?.message ?? e}`);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Title>Send offline</Title>
        <Sub>
          Seal sats into a Cashu token, then hand it over any channel. The recipient needs zero internet until
          they claim.
        </Sub>

        <Card>
          <Text style={s.label}>Amount (sats) · balance {w.cashuBalance}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="50"
            placeholderTextColor={COLORS.muted}
            style={s.input}
          />
          <Text style={s.label}>Memo (optional)</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="transport, Dakar"
            placeholderTextColor={COLORS.muted}
            style={s.input}
          />
          <Text style={s.label}>Recipient npub (for Nostr DM)</Text>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder="npub1…"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            style={s.input}
          />
          <Btn label={busy ? 'Sealing…' : 'Seal token'} onPress={() => void seal()} disabled={busy} />
          {msg !== '' && <Sub>{msg}</Sub>}
        </Card>

        {token !== '' && (
          <Card>
            <Text style={s.rowTitle}>Token ready — works fully offline from here</Text>
            <View style={s.qrWrap}>
              <QRCode value={token} size={200} color="#0B0B0F" backgroundColor="#FFFFFF" />
            </View>
            <Text style={s.mono} selectable numberOfLines={3}>
              {token}
            </Text>
            <Btn label="Copy token text" kind="ghost" onPress={() => Clipboard.setStringAsync(shareText(token))} />
            <Btn label="Send via encrypted Nostr DM" onPress={() => void onNostrSend()} disabled={busy} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Btn label="SMS" kind="ghost" onPress={() => void onShare('sms')} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn label="WhatsApp" kind="ghost" onPress={() => void onShare('whatsapp')} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn label="Share" kind="ghost" onPress={() => void onShare('any')} />
              </View>
            </View>
            <Sub>{token.length} chars — small enough for one SMS segment pair or a single QR.</Sub>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#0B0B0F',
    borderWidth: 1,
    borderColor: '#2B2B36',
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  mono: { color: COLORS.muted, fontSize: 11 },
  rowTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  qrWrap: { backgroundColor: '#fff', alignSelf: 'center', padding: 12, borderRadius: 12, marginVertical: 8 },
});
