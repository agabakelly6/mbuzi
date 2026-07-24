// supabase/functions/send-push-notification/webpush.ts
//
// A from-scratch Web Push sender using only Deno's native Web Crypto API —
// deliberately not the `web-push` npm package, which crashes the Supabase
// Edge Runtime outright (not even a catchable JS error) when its
// sendNotification() is called, confirmed by isolating it in a standalone
// test function before writing this. Implements RFC 8291 (message
// encryption, aes128gcm) and the VAPID JWT auth scheme directly against
// the push service's HTTP endpoint.
function base64UrlToBytes(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

async function importVapidPrivateKey(publicKeyB64: string, privateKeyB64: string): Promise<CryptoKey> {
  const publicBytes = base64UrlToBytes(publicKeyB64); // 65 bytes: 0x04 || X(32) || Y(32)
  const x = publicBytes.slice(1, 33);
  const y = publicBytes.slice(33, 65);
  const d = base64UrlToBytes(privateKeyB64);

  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(x),
    y: bytesToBase64Url(y),
    d: bytesToBase64Url(d),
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function buildVapidHeader(endpoint: string, subject: string, publicKey: string, privateKey: string): Promise<string> {
  const origin = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const claims = { aud: origin, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: subject };

  const encoder = new TextEncoder();
  const unsigned = `${bytesToBase64Url(encoder.encode(JSON.stringify(header)))}.${bytesToBase64Url(encoder.encode(JSON.stringify(claims)))}`;

  const key = await importVapidPrivateKey(publicKey, privateKey);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(unsigned));

  const jwt = `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
  return `vapid t=${jwt}, k=${publicKey}`;
}

/** RFC 8291 message encryption for a single-record aes128gcm payload. */
async function encryptPayload(
  payload: string,
  subscriberPublicKeyB64: string,
  authSecretB64: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const encoder = new TextEncoder();
  const subscriberPublicKey = base64UrlToBytes(subscriberPublicKeyB64);
  const authSecret = base64UrlToBytes(authSecretB64);

  const recipientKey = await crypto.subtle.importKey("raw", subscriberPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ephemeralKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const ephemeralPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey));

  const sharedSecretBits = await crypto.subtle.deriveBits({ name: "ECDH", public: recipientKey }, ephemeralKeyPair.privateKey, 256);
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // RFC 8291 key combination step — derives the actual IKM for RFC 8188 from the ECDH shared secret.
  const keyInfo = concatBytes(encoder.encode("WebPush: info\0"), subscriberPublicKey, ephemeralPublicRaw);
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  // RFC 8188 aes128gcm — a fresh random salt per message.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  // Single record: plaintext || 0x02 delimiter (last-record padding marker, no extra padding).
  const plaintext = concatBytes(encoder.encode(payload), new Uint8Array([2]));

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext));

  // aes128gcm content-coding header: salt(16) || record size(4, big-endian) || keyid length(1) || keyid(ephemeral pubkey, 65).
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  const keyIdLength = new Uint8Array([ephemeralPublicRaw.length]);

  const body = concatBytes(salt, recordSize, keyIdLength, ephemeralPublicRaw, ciphertext);

  return {
    body,
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
    },
  };
}

export interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushResult {
  ok: boolean;
  status: number;
}

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: string,
  vapidSubject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<WebPushResult> {
  const { body, headers } = await encryptPayload(payload, subscription.p256dh, subscription.auth);
  const vapidHeader = await buildVapidHeader(subscription.endpoint, vapidSubject, vapidPublicKey, vapidPrivateKey);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      ...headers,
      Authorization: vapidHeader,
      TTL: "86400",
    },
    body,
  });

  return { ok: response.ok, status: response.status };
}
