declare module 'react-native-qrcode-svg' {
  import type { Component } from 'react';
  export interface QRCodeProps {
    value?: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    getRef?: (ref: any) => void;
  }
  export default class QRCode extends Component<QRCodeProps> {
    toDataURL(cb: (data: string) => void): void;
  }
}
