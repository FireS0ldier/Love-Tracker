// Utility functions for client-side encryption using AES-GCM
// This is a simplified implementation for the MVP

/**
 * Encrypts sensitive data using AES-GCM
 * @param {string} text - The text to encrypt
 * @param {string} key - The encryption key (for MVP, this would be a derived key from couple ID)
 * @returns {Promise<string>} - The encrypted text as a base64 string
 */
export const encryptData = async (text, key) => {
  try {
    // For MVP we'll use a simple key derivation
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Use SubtleCrypto API for encryption
    const cryptoKey = await deriveKey(key);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      cryptoKey,
      data
    );
    
    // Combine IV and encrypted data for storage
    const encryptedArray = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedArray.set(iv);
    encryptedArray.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encryptedArray));
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

/**
 * Decrypts data that was encrypted with AES-GCM
 * @param {string} encryptedText - The encrypted text as a base64 string
 * @param {string} key - The encryption key
 * @returns {Promise<string>} - The decrypted text
 */
export const decryptData = async (encryptedText, key) => {
  try {
    // Convert from base64 to array
    const encryptedArray = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = encryptedArray.slice(0, 12);
    const encryptedData = encryptedArray.slice(12);
    
    // Use SubtleCrypto API for decryption
    const cryptoKey = await deriveKey(key);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      cryptoKey,
      encryptedData
    );
    
    // Convert decrypted data to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

/**
 * Derives a cryptographic key from a string (simplified for MVP)
 * @param {string} keyString - String to derive key from
 * @returns {Promise<CryptoKey>} - Derived key
 */
const deriveKey = async (keyString) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  
  // Hash the key string for consistent length
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  
  // Import the key for AES-GCM
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
};
