import crypto from "crypto";

/**
 * Envelope encryption for tenant Firebase service-account credentials.
 *
 * Each secret is encrypted with a fresh random 256-bit data key (DEK) using
 * AES-256-GCM. The DEK is then wrapped (encrypted) with the master key (KEK)
 * loaded from OPENPATH_ENC_KEY. We store only ciphertext + iv + authTag +
 * wrappedKey — never the plaintext, and never the DEK in the clear.
 *
 * Decryption happens exclusively in the Node.js server runtime; the master key
 * and decrypted credentials are never sent to the browser.
 */

const ALGO = "aes-256-gcm";

function masterKey(): Buffer {
  const b64 = process.env.OPENPATH_ENC_KEY;
  if (!b64) {
    throw new Error(
      "OPENPATH_ENC_KEY is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    );
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("OPENPATH_ENC_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

export interface SealedSecret {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  wrappedKey: string; // base64 of [iv(12) | authTag(16) | wrappedDEK]
}

/** Encrypt a plaintext string into a sealed secret. */
export function seal(plaintext: string): SealedSecret {
  const dek = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, dek, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Wrap the DEK with the master key.
  const kekIv = crypto.randomBytes(12);
  const kekCipher = crypto.createCipheriv(ALGO, masterKey(), kekIv);
  const wrapped = Buffer.concat([kekCipher.update(dek), kekCipher.final()]);
  const kekTag = kekCipher.getAuthTag();
  const wrappedKey = Buffer.concat([kekIv, kekTag, wrapped]);

  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    wrappedKey: wrappedKey.toString("base64"),
  };
}

/** Decrypt a sealed secret back into the original plaintext. */
export function open(sealed: SealedSecret): string {
  const wrappedKey = Buffer.from(sealed.wrappedKey, "base64");
  const kekIv = wrappedKey.subarray(0, 12);
  const kekTag = wrappedKey.subarray(12, 28);
  const wrapped = wrappedKey.subarray(28);

  const kekDecipher = crypto.createDecipheriv(ALGO, masterKey(), kekIv);
  kekDecipher.setAuthTag(kekTag);
  const dek = Buffer.concat([
    kekDecipher.update(wrapped),
    kekDecipher.final(),
  ]);

  const decipher = crypto.createDecipheriv(
    ALGO,
    dek,
    Buffer.from(sealed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(sealed.authTag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}

/** Convenience for generating a master key (used in setup docs / scripts). */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

/** Short opaque token (invites, join codes). */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Human-friendly join code, e.g. "K7P2-9QXM". */
export function randomJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const pick = () =>
    Array.from(
      { length: 4 },
      () => alphabet[crypto.randomInt(alphabet.length)],
    ).join("");
  return `${pick()}-${pick()}`;
}
