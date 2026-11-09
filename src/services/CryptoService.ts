import { EncryptedPayload } from '../types';

const MAGIC_HEADER = 'AURA_VAULT_V1::';
const PBKDF2_ITERATIONS = 100000;

export class CryptoService {
  private static getCrypto(): Crypto {
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      return globalThis.crypto;
    }
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto;
    }
    throw new Error('Web Crypto API is not available in this environment');
  }

  // Convert ArrayBuffer to Base64 (Universal across browser & node)
  private static bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buf);
    if (typeof btoa !== 'undefined') {
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    return Buffer.from(bytes).toString('base64');
  }

  // Convert Base64 to Uint8Array (Universal across browser & node)
  private static base64ToBuffer(base64: string): Uint8Array {
    if (typeof atob !== 'undefined') {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  // Derive AES-GCM 256 key from passphrase + salt using PBKDF2
  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const crypto = this.getCrypto();
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt plaintext with AES-GCM 256
  public static async encrypt(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
    const crypto = this.getCrypto();
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(passphrase, salt);
    const payloadToEncrypt = enc.encode(MAGIC_HEADER + plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      payloadToEncrypt
    );

    return {
      salt: this.bufferToBase64(salt),
      iv: this.bufferToBase64(iv),
      ciphertext: this.bufferToBase64(ciphertextBuffer),
    };
  }

  // Decrypt ciphertext with AES-GCM 256
  public static async decrypt(payload: EncryptedPayload, passphrase: string): Promise<string> {
    try {
      const crypto = this.getCrypto();
      const salt = this.base64ToBuffer(payload.salt);
      const iv = this.base64ToBuffer(payload.iv);
      const ciphertext = this.base64ToBuffer(payload.ciphertext);

      const key = await this.deriveKey(passphrase, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
        },
        key,
        ciphertext as BufferSource
      );

      const dec = new TextDecoder();
      const decryptedText = dec.decode(decryptedBuffer);

      if (!decryptedText.startsWith(MAGIC_HEADER)) {
        throw new Error('Decryption header validation failed');
      }

      return decryptedText.slice(MAGIC_HEADER.length);
    } catch {
      throw new Error('Incorrect passphrase or corrupted encrypted data');
    }
  }
}
