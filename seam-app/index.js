// Custom entry: polyfills first, then Expo Router (per docs).
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import 'expo-router/entry';
