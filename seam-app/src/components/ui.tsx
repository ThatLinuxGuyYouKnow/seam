import { StyleSheet, Text, View, TouchableOpacity, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

export const COLORS = {
  bg: '#0B0B0F',
  card: '#15151D',
  gold: '#F5B544',
  text: '#F4F1EA',
  muted: '#9A93A6',
  green: '#3DDC84',
  red: '#FF6B6B',
};

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, kind === 'ghost' && styles.btnGhost, disabled && styles.btnDisabled]}
    >
      <Text style={[styles.btnText, kind === 'ghost' && styles.btnGhostText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#26262F',
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  sub: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  btn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.gold },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#0B0B0F', fontWeight: '800', fontSize: 15 },
  btnGhostText: { color: COLORS.gold },
});
