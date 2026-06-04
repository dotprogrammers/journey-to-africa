import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for encryption');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (Buffer.byteLength(ENCRYPTION_KEY, 'utf8') !== 32) {
  throw new Error(
    `ENCRYPTION_KEY must be exactly 32 bytes (24 characters in base64). Current length: ${Buffer.byteLength(ENCRYPTION_KEY, 'utf8')} bytes. Generate one with: openssl rand -base64 24`
  );
}

const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) {
      throw new Error('Invalid encrypted format: missing IV or ciphertext');
    }
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed. Data may be corrupted or encrypted with a different key.');
  }
}
