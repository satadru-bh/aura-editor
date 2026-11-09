import { describe, it, expect } from 'vitest';
import { CryptoService } from './CryptoService';

describe('CryptoService (Zero-Knowledge AES-GCM-256)', () => {
  it('should encrypt and decrypt plaintext accurately with the correct passphrase', async () => {
    const message = '# Highly Confidential Project\nTop secret client-side data.';
    const passphrase = 'UltraSecurePassword123!';

    const encrypted = await CryptoService.encrypt(message, passphrase);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(message);

    const decrypted = await CryptoService.decrypt(encrypted, passphrase);
    expect(decrypted).toBe(message);
  });

  it('should throw an error when attempting to decrypt with an incorrect passphrase', async () => {
    const message = 'Secret message';
    const passphrase = 'CorrectPassword123';
    const wrongPassphrase = 'WrongPassword456';

    const encrypted = await CryptoService.encrypt(message, passphrase);

    await expect(CryptoService.decrypt(encrypted, wrongPassphrase)).rejects.toThrow();
  });
});
