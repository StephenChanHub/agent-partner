export class SecretCryptoService {
  encryptSecret(raw: string): string {
    return `encrypted:${raw}`;
  }

  decryptSecret(encrypted: string): string {
    return encrypted.startsWith('encrypted:') ? encrypted.slice('encrypted:'.length) : encrypted;
  }

  maskSecret(raw: string): string {
    const tail = raw.slice(-4);
    return `****${tail}`;
  }
}
