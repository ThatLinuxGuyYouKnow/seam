import { Stack } from 'expo-router';
import { WalletProvider } from '../store/wallet';

export default function RootLayout() {
  return (
    <WalletProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0B0B0F' },
          headerTintColor: '#F5B544',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0B0B0F' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Seam · Cashu Bridge' }} />
        <Stack.Screen name="mint" options={{ title: 'Lightning → Cashu' }} />
        <Stack.Screen name="send" options={{ title: 'Send offline' }} />
        <Stack.Screen name="receive" options={{ title: 'Receive' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings & backup' }} />
      </Stack>
    </WalletProvider>
  );
}
