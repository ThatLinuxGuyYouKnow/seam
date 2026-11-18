import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Btn, Card, COLORS, Screen, Sub, Title } from '../components/ui';
import { demoMint, realCreateMintQuote, realMintFromQuote } from '../lib/cashu';
import { useWallet } from '../store/wallet';

export default function MintScreen() {
  const w = useWallet();
  const [amount, setAmount] = useState('100');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [msg, setMsg] = useState('');

  const sats = parseInt(amount, 10) || 0;
  const effectiveMint = w.demoMode ? `demo:${w.mintUrl}` : w.mintUrl;

  const onDemoMint = async () => {
    if (sats <= 0) {
      setMsg('Enter an amount above 0.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const rec = await demoMint(sats, effectiveMint, memo || undefined);
      await w.refresh();
      setMsg(`Minted ${rec.amount} sats (demo). Token saved to balance.`);
    } catch (e: any) {
      setMsg(e?.message ?? 'Mint failed.');
    } finally {
      setBusy(false);
    }
  };

  const onCreateQuote = async () => {
    if (sats <= 0) {
      setMsg('Enter an amount above 0.');
      return;
    }
    setBusy(true);
    setMsg('');
    setInvoice('');
    try {
      const q = await realCreateMintQuote(w.mintUrl, sats);
      setInvoice(q.request);
      setQuoteId(q.quote);
      setMsg('Pay this Lightning invoice from any wallet, then tap “Check & mint”.');
    } catch (e: any) {
      setMsg(`Quote failed: ${e?.message ?? e}. The mint may be offline — use Demo mode.`);
    } finally {
      setBusy(false);
    }
  };

  const onCheckAndMint = async () => {
    setBusy(true);
    try {
      const r = await realMintFromQuote(w.mintUrl, sats, quoteId);
      const { importToken } = await import('../lib/cashu');
      await importToken(r.token, w.mintUrl, r.amount);
      await w.refresh();
      setMsg(`Minted ${r.amount} sats from Lightning.`);
      setInvoice('');
      setQuoteId('');
    } catch (e: any) {
      setMsg(`Not paid yet or mint error: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Title>Top up: Lightning → Cashu</Title>
        <Sub>
          {w.demoMode
            ? 'Demo mode is ON: minting is instant and offline. Turn it off in Settings for a live Lightning invoice.'
            : `Live mode against ${w.mintUrl}. You pay a Lightning invoice, then mint ecash tokens.`}
        </Sub>

        <Card>
          <Text style={s.label}>Amount (sats)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={COLORS.muted}
            style={s.input}
          />
          <Text style={s.label}>Memo (optional)</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="market day"
            placeholderTextColor={COLORS.muted}
            style={s.input}
          />
          {w.demoMode ? (
            <Btn label={busy ? 'Minting…' : `Mint ${sats} sats (demo)`} onPress={onDemoMint} disabled={busy} />
          ) : (
            <View style={{ gap: 8 }}>
              <Btn label={busy ? 'Working…' : 'Create Lightning invoice'} onPress={onCreateQuote} disabled={busy} />
              {invoice !== '' && (
                <>
                  <View style={s.qrWrap}>
                    <QRCode value={invoice} size={210} color="#0B0B0F" backgroundColor="#FFFFFF" />
                  </View>
                  <Text style={s.mono} selectable>
                    {invoice}
                  </Text>
                  <Btn
                    label="Copy invoice"
                    kind="ghost"
                    onPress={() => Clipboard.setStringAsync(invoice)}
                  />
                  <Btn label={busy ? 'Checking…' : 'Check & mint tokens'} onPress={onCheckAndMint} disabled={busy} />
                </>
              )}
            </View>
          )}
          {msg !== '' && <Sub>{msg}</Sub>}
        </Card>

        <Card>
          <Text style={s.rowTitle}>Balance</Text>
          <Text style={s.balance}>{w.cashuBalance} sats</Text>
          <Sub>{w.tokens.length} stored token(s). Tokens are bearer cash — back up your device.</Sub>
        </Card>
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
    fontSize: 16,
  },
  mono: { color: COLORS.muted, fontSize: 11 },
  rowTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  balance: { color: COLORS.gold, fontSize: 30, fontWeight: '800' },
  qrWrap: { backgroundColor: '#fff', alignSelf: 'center', padding: 12, borderRadius: 12, marginVertical: 8 },
});
