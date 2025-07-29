/**
 * Encryption utility for securely storing API keys
 * Uses AES-256-CBC encryption with random initialization vectors
 */
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
}

/**
 * Encrypts an API key for secure storage
 * @param text - The plain text API key to encrypt
 * @returns Encrypted string in format: iv:encryptedData
 */
export function encryptApiKey(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!, 'utf8'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return format: iv:encryptedData
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypts an API key for use
 * @param encryptedText - The encrypted string in format: iv:encryptedData
 * @returns The decrypted plain text API key
 */
export function decryptApiKey(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!, 'utf8'), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Validates if a string looks like a valid OpenAI API key
 * @param apiKey - The API key to validate
 * @returns True if the format appears valid
 */
export function validateOpenAIApiKey(apiKey: string): boolean {
  // OpenAI API keys start with 'sk-' and are typically 51 characters long
  return typeof apiKey === 'string' && 
         apiKey.startsWith('sk-') && 
         apiKey.length >= 20;
} 