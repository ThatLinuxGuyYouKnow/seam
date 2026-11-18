import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Btn, Card, COLORS, Screen, Sub, Title } from '../components/ui';
import { importToken, realMelt } from '../lib/cashu';
import { relaysFor } from '../lib/config';
import { formatNpub, getInbox, pollInbox, type InboxMessage } from '../lib/nostr';
import { useWallet } from '../store/wallet';

export default function ReceiveScreen() {
  const w = useWallet();
  const [pasted, setPasted] = useState('');
  const [invoice, setInvoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const onImport = async (raw: string) => {
    const t = raw.trim();
    if (!t) {
      setMsg('Paste a cashu token first.');
      return;
    }
    setBusy(true);
    try {
      const mint = w.demoMode ? `demo:${w.mintUrl}` : w.mintUrl;
      // Demo tokens carry no decodable amount; credit a best-effort amount parsed from UI context.
      const rec = await importToken(t, mint);
      await w.refresh();
      setMsg(
        rec.amount > 0
          ? `Imported ${rec.amount} sats.`
          : 'Token stored. (Demo tokens minted in-app credit automatically on the mint screen.)',
      );
      setPasted('');
    } catch (e: any) {
      setMsg(e?.message ?? 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const onPoll = async () => {
    if (!w.identity) return;
    setBusy(true);
    setMsg('');
    try {
      const all = await pollInbox(w.identity.skHex, w.identity.pkHex, relaysFor(w.lowBandwidth, w.relays));
      setInbox(all);
      setMsg(all.length === 0 ? 'No Seam DMs on these relays yet.' : `Found ${all.length} Seam DM(s).`);
    } catch {
      // Offline: show cached inbox.
      const cached = await getInbox();
      setInbox(cached);
      setMsg(`Relays unreachable — showing ${cached.length} cached message(s).`);
    } finally {
      setBusy(false);
    }
  };

  const onClaimMelt = async () => {
    if (!invoice.trim()) {
      setMsg('Paste a Lightning invoice to melt to (live mode).');
      return;
    }
    setBusy(true);
    try {
      const r = await realMelt(w.mintUrl, invoice.trim());
      setMsg(r.paid ? 'Paid.' : `Melt quote created (${r.txId ?? 'pending'}). Pay flow continues against the mint.`);
    } catch (e: any) {
      setMsg(`Melt failed: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Title>Receive / claim</Title>
        <Sub>Three ways in: Nostr inbox, pasted text (SMS/WhatsApp), or QR scan. Works the moment you reconnect.</Sub>

        <Card>
          <Text style={s.rowTitle}>Nostr inbox (NIP-17)</Text>
          <Btn label={busy ? 'Checking…' : 'Check for Seam DMs'} onPress={() => void onPoll()} disabled={busy} />
          {msg !== '' && <Sub>{msg}</Sub>}
          {inbox.map((m) => (
            <View key={m.id} style={s.dm}>
              <Text style={s.dmFrom}>from {formatNpub(m.fromPubkey)}</Text>
              {m.token ? (
                <>
                  <Text style={s.mono} numberOfLines={2} selectable>
                    {m.token}
                  </Text>
                  <Btn label="Claim this token" kind="ghost" onPress={() => void onImport(m.token!)} />
                </>
              ) : (
                <Sub>{m.text.slice(0, 120)}</Sub>
              )}
            </View>
          ))}
        </Card>

        <Card>
          <Text style={s.rowTitle}>Paste token (SMS / WhatsApp)</Text>
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            placeholder="cashuB…"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            multiline
            style={[s.input, { minHeight: 70 }]}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Btn label="Claim" onPress={() => void onImport(pasted)} disabled={busy} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn
                label="Paste"
                kind="ghost"
                onPress={async () => setPasted(await Clipboard.getStringAsync())}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={s.rowTitle}>Scan QR (offline)</Text>
          {!permission?.granted ? (
            <Btn label="Allow camera" onPress={() => void requestPermission()} />
          ) : scanning ? (
            <View style={{ height: 260, borderRadius: 12, overflow: 'hidden' }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={(res) => {
                  setScanning(false);
                  void onImport(res.data);
                }}
              />
              <Btn label="Cancel" kind="ghost" onPress={() => setScanning(false)} />
            </View>
          ) : (
            <Btn label="Open scanner" onPress={() => setScanning(true)} />
          )}
        </Card>

        {!w.demoMode && (
          <Card>
            <Text style={s.rowTitle}>Claim to Lightning (live melt)</Text>
            <TextInput
              value={invoice}
              onChangeText={setInvoice}
              placeholder="lnbc… invoice"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              multiline
              style={[s.input, { minHeight: 60 }]}
            />
            <Btn label="Melt to invoice" onPress={() => void onClaimMelt()} disabled={busy} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
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
  dm: { borderTopWidth: 1, borderTopColor: '#26262F', paddingTop: 8, gap: 6 },
  dmFrom: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
});
