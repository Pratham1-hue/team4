/**
 * Client-side AES-256-GCM zero-knowledge encryption & WebAuthn biometrics for Yatri Travel Vault.
 */

// Helper: Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive AES-256-GCM CryptoKey from PIN and Salt using PBKDF2 with 100,000 iterations
 */
export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt ArrayBuffer using AES-256-GCM
 */
export async function encryptBuffer(
  buffer: ArrayBuffer,
  pin: string
): Promise<{ cipherBase64: string; ivBase64: string; saltBase64: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    buffer
  );

  return {
    cipherBase64: bufferToBase64(ciphertext),
    ivBase64: bufferToBase64(iv),
    saltBase64: bufferToBase64(salt),
  };
}

/**
 * Decrypt AES-256-GCM ciphertext to ArrayBuffer
 */
export async function decryptBuffer(
  cipherBase64: string,
  ivBase64: string,
  saltBase64: string,
  pin: string
): Promise<ArrayBuffer> {
  const ciphertext = base64ToBuffer(cipherBase64);
  const iv = base64ToBuffer(ivBase64);
  const salt = base64ToBuffer(saltBase64);

  const key = await deriveKey(pin, salt);

  return window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );
}

/**
 * Hash a user PIN with salt for authentication
 */
export async function hashPin(
  pin: string,
  existingSalt?: string
): Promise<{ hash: string; salt: string }> {
  const saltBytes = existingSalt ? base64ToBuffer(existingSalt) : window.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const pinBytes = enc.encode(pin);
  const combined = new Uint8Array(saltBytes.length + pinBytes.length);
  combined.set(saltBytes, 0);
  combined.set(pinBytes, saltBytes.length);

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", combined);
  return {
    hash: bufferToBase64(hashBuffer),
    salt: bufferToBase64(saltBytes),
  };
}

/**
 * Verify if entered PIN matches stored hash
 */
export async function verifyPin(pin: string, storedHash: string, salt: string): Promise<boolean> {
  const res = await hashPin(pin, salt);
  return res.hash === storedHash;
}

/**
 * Check if WebAuthn Biometrics (TouchID, FaceID, Windows Hello) is supported
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Register WebAuthn Biometric Credential
 */
export async function registerBiometrics(username: string): Promise<string | null> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return null;

  try {
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const userId = window.crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Yatri Travel Vault" },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential;

    return credential ? bufferToBase64(credential.rawId) : null;
  } catch (err) {
    console.warn("Biometrics registration skipped or cancelled:", err);
    return null;
  }
}

/**
 * Authenticate with WebAuthn Biometrics
 */
export async function authenticateBiometrics(credentialIdBase64: string): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.credentials) return false;

  try {
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const rawId = base64ToBuffer(credentialIdBase64);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            type: "public-key",
            id: rawId as BufferSource,
          },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch (err) {
    console.warn("Biometrics auth failed or dismissed:", err);
    return false;
  }
}

