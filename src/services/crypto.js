/**
 * Web Crypto API - SubtleCrypto AES-GCM 256-bit + PBKDF2
 * 提供暗碼端到端加密、防駭解密，可用於群組對話、危險旗標與彩色災害圈加密
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(passcode, saltStr = "TAIWAN_SAFE_HAVEN_SALT") {
  const passwordBytes = encoder.encode(passcode);
  const saltBytes = encoder.encode(saltStr);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 加密文字
export async function encryptMessage(text, passcode) {
  if (!passcode || !text) return text;
  try {
    const key = await getKey(passcode);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    let binary = '';
    combined.forEach(b => binary += String.fromCharCode(b));
    return 'CIPHER:' + btoa(binary);
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

// 解密文字
export async function decryptMessage(ciphertext, passcode) {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('CIPHER:')) {
    return ciphertext;
  }
  if (!passcode) {
    return '🔒 [加密訊息 - 未輸入暗碼無法讀取]';
  }

  try {
    const rawBase64 = ciphertext.replace('CIPHER:', '');
    const binary = atob(rawBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    const key = await getKey(passcode);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return decoder.decode(decryptedBuffer);
  } catch (err) {
    return '⚠️ [加密訊息 - 暗碼不相符，無法讀取內容]';
  }
}

// 加密危險旗子點位
export async function encryptDangerFlag(flagData, passcode) {
  const jsonStr = JSON.stringify(flagData);
  const encryptedPayload = await encryptMessage(jsonStr, passcode);
  return {
    id: flagData.id || ('flag-' + Date.now()),
    isEncrypted: true,
    lat: flagData.lat,
    lng: flagData.lng,
    payload: encryptedPayload,
    createdAt: flagData.createdAt || new Date().toISOString()
  };
}

export async function decryptDangerFlag(encryptedFlag, passcode) {
  if (!encryptedFlag || !encryptedFlag.payload) return null;
  const decryptedJson = await decryptMessage(encryptedFlag.payload, passcode);
  if (decryptedJson.startsWith('🔒') || decryptedJson.startsWith('⚠️')) {
    return null;
  }
  try {
    const parsed = JSON.parse(decryptedJson);
    return {
      ...parsed,
      id: encryptedFlag.id || parsed.id,
      lat: encryptedFlag.lat !== undefined ? encryptedFlag.lat : parsed.lat,
      lng: encryptedFlag.lng !== undefined ? encryptedFlag.lng : parsed.lng
    };
  } catch (e) {
    return null;
  }
}

// 加密自訂彩色災害範圍圈 (Custom Hazard Circles)
export async function encryptHazardZone(zoneData, passcode) {
  const jsonStr = JSON.stringify(zoneData);
  const encryptedPayload = await encryptMessage(jsonStr, passcode);
  return {
    id: zoneData.id || ('hazard-custom-' + Date.now()),
    isEncrypted: true,
    lat: zoneData.lat,
    lng: zoneData.lng,
    radiusMeters: zoneData.radiusMeters,
    color: zoneData.color,
    payload: encryptedPayload,
    createdAt: zoneData.createdAt || new Date().toISOString()
  };
}

export async function decryptHazardZone(encryptedZone, passcode) {
  if (!encryptedZone || !encryptedZone.payload) return null;
  const decryptedJson = await decryptMessage(encryptedZone.payload, passcode);
  if (decryptedJson.startsWith('🔒') || decryptedJson.startsWith('⚠️')) {
    return null;
  }
  try {
    const parsed = JSON.parse(decryptedJson);
    return {
      ...parsed,
      lat: parsed.lat || encryptedZone.lat,
      lng: parsed.lng || encryptedZone.lng,
      radiusMeters: parsed.radiusMeters || encryptedZone.radiusMeters,
      color: parsed.color || encryptedZone.color
    };
  } catch (e) {
    return null;
  }
}
