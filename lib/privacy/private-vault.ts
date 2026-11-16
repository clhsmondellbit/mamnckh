/**
 * Browser-only, passphrase-encrypted private workspace.
 * Plaintext is held in memory only; IndexedDB stores AES-GCM ciphertext.
 * This protects stored records at rest on the device, not against XSS,
 * malicious extensions, compromised browsers, or an unlocked device.
 */

const DATABASE_NAME = 'mam-private-vault-v1';
const DATABASE_VERSION = 1;
const META_STORE = 'metadata';
const RECORD_STORE = 'records';
const META_KEY = 'vault';
const CHECK_TEXT = 'MAM_PRIVATE_VAULT_OK_V1';
const PBKDF2_ITERATIONS = 310_000;
const MAX_RECORD_BYTES = 96 * 1024;

export type EncryptedRecord<T> = {
  id: string;
  kind: string;
  value: T;
  createdAt: string;
  updatedAt: string;
};

type VaultMeta = {
  key: string;
  salt: string;
  checkIv: string;
  checkCiphertext: string;
  createdAt: string;
};

type StoredRecord = {
  id: string;
  kind: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
  updatedAt: string;
};

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultError';
  }
}

export function validateVaultPassphrase(passphrase: string): string | null {
  if (passphrase.length < 12) return 'Cụm mật khẩu cần ít nhất 12 ký tự.';
  if (passphrase.length > 256) return 'Cụm mật khẩu quá dài.';
  if (passphrase.trim().length < 12) return 'Cụm mật khẩu cần có ít nhất 12 ký tự không phải khoảng trắng.';
  return null;
}

export function isValidVaultRecordId(value: string): boolean {
  // The suffix intentionally permits short stable keys such as `journey:self`.
  return /^[a-z][a-z0-9_-]{0,39}:[a-z0-9][a-z0-9_-]{0,79}$/i.test(value);
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined' || !globalThis.crypto?.subtle) {
    throw new VaultError('Trình duyệt này chưa hỗ trợ kho lưu trữ mã hóa.');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(META_STORE)) database.createObjectStore(META_STORE, { keyPath: 'key' });
      if (!database.objectStoreNames.contains(RECORD_STORE)) database.createObjectStore(RECORD_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new VaultError('Không thể mở kho dữ liệu riêng tư trên thiết bị.'));
    request.onblocked = () => reject(new VaultError('Một tab khác đang cập nhật kho dữ liệu. Hãy đóng tab MẦM còn mở rồi thử lại.'));
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new VaultError('Không thể đọc dữ liệu.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new VaultError('Không thể lưu dữ liệu.'));
    transaction.onabort = () => reject(transaction.error || new VaultError('Giao dịch lưu dữ liệu đã bị hủy.'));
  });
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveEncryptionKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptText(key: CryptoKey, text: string, additionalData: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(additionalData), tagLength: 128 },
    key,
    new TextEncoder().encode(text),
  );
  return { iv: encodeBase64(iv), ciphertext: encodeBase64(new Uint8Array(ciphertext)) };
}

async function decryptText(key: CryptoKey, iv: string, ciphertext: string, additionalData: string) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(iv), additionalData: new TextEncoder().encode(additionalData), tagLength: 128 },
    key,
    decodeBase64(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export async function hasPrivateVault(): Promise<boolean> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(META_STORE, 'readonly');
    const metadata = await requestValue<VaultMeta | undefined>(transaction.objectStore(META_STORE).get(META_KEY));
    await transactionComplete(transaction);
    return Boolean(metadata?.salt && metadata.checkIv && metadata.checkCiphertext);
  } finally {
    database.close();
  }
}

export interface PrivateVaultSession {
  list<T>(kind: string): Promise<Array<EncryptedRecord<T>>>;
  put<T>(record: EncryptedRecord<T>): Promise<void>;
  delete(id: string): Promise<void>;
  exportAll(): Promise<Array<EncryptedRecord<unknown>>>;
  eraseEverything(): Promise<void>;
  close(): void;
}

export async function unlockPrivateVault(passphrase: string): Promise<PrivateVaultSession> {
  const passphraseError = validateVaultPassphrase(passphrase);
  if (passphraseError) throw new VaultError(passphraseError);

  const database = await openDatabase();
  try {
    const readTransaction = database.transaction(META_STORE, 'readonly');
    let metadata = await requestValue<VaultMeta | undefined>(readTransaction.objectStore(META_STORE).get(META_KEY));
    await transactionComplete(readTransaction);

    if (!metadata) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveEncryptionKey(passphrase, salt);
      const encryptedCheck = await encryptText(key, CHECK_TEXT, META_KEY);
      const initialMeta: VaultMeta = {
        key: META_KEY,
        salt: encodeBase64(salt),
        checkIv: encryptedCheck.iv,
        checkCiphertext: encryptedCheck.ciphertext,
        createdAt: new Date().toISOString(),
      };
      const createTransaction = database.transaction(META_STORE, 'readwrite');
      createTransaction.objectStore(META_STORE).add(initialMeta);
      await transactionComplete(createTransaction);
      metadata = initialMeta;
    }

    const encryptionKey = await deriveEncryptionKey(passphrase, decodeBase64(metadata.salt));
    try {
      const check = await decryptText(encryptionKey, metadata.checkIv, metadata.checkCiphertext, META_KEY);
      if (check !== CHECK_TEXT) throw new Error('Invalid check value');
    } catch {
      throw new VaultError('Cụm mật khẩu chưa đúng. Dữ liệu vẫn được giữ nguyên.');
    }

    let isClosed = false;
    const assertOpen = () => {
      if (isClosed) throw new VaultError('Kho dữ liệu đã khóa. Hãy mở khóa lại để tiếp tục.');
    };

    async function readRecords(): Promise<StoredRecord[]> {
      assertOpen();
      const transaction = database.transaction(RECORD_STORE, 'readonly');
      const result = await requestValue<StoredRecord[]>(transaction.objectStore(RECORD_STORE).getAll());
      await transactionComplete(transaction);
      return result;
    }

    async function decryptRecord<T>(stored: StoredRecord): Promise<EncryptedRecord<T>> {
      const json = await decryptText(encryptionKey, stored.iv, stored.ciphertext, stored.id);
      const value = JSON.parse(json) as T;
      return { id: stored.id, kind: stored.kind, value, createdAt: stored.createdAt, updatedAt: stored.updatedAt };
    }

    return {
      async list<T>(kind: string) {
        if (!/^[a-z][a-z0-9_-]{0,39}$/.test(kind)) throw new VaultError('Loại dữ liệu không hợp lệ.');
        const stored = (await readRecords()).filter((record) => record.kind === kind);
        const decrypted: Array<EncryptedRecord<T>> = [];
        for (const item of stored) decrypted.push(await decryptRecord<T>(item));
        return decrypted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      },
      async put<T>(record: EncryptedRecord<T>) {
        assertOpen();
        if (!/^[a-z][a-z0-9_-]{0,39}$/.test(record.kind) || !isValidVaultRecordId(record.id)) {
          throw new VaultError('Mã bản ghi không hợp lệ.');
        }
        const json = JSON.stringify(record.value);
        const size = new TextEncoder().encode(json).byteLength;
        if (size > MAX_RECORD_BYTES) throw new VaultError('Bản ghi quá lớn; hãy chia nội dung thành các phần nhỏ hơn.');
        const encrypted = await encryptText(encryptionKey, json, record.id);
        const stored: StoredRecord = {
          id: record.id,
          kind: record.kind,
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
        const transaction = database.transaction(RECORD_STORE, 'readwrite');
        transaction.objectStore(RECORD_STORE).put(stored);
        await transactionComplete(transaction);
      },
      async delete(id: string) {
        assertOpen();
        const transaction = database.transaction(RECORD_STORE, 'readwrite');
        transaction.objectStore(RECORD_STORE).delete(id);
        await transactionComplete(transaction);
      },
      async exportAll() {
        const stored = await readRecords();
        const decrypted: Array<EncryptedRecord<unknown>> = [];
        for (const item of stored) decrypted.push(await decryptRecord<unknown>(item));
        return decrypted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },
      async eraseEverything() {
        assertOpen();
        const transaction = database.transaction([META_STORE, RECORD_STORE], 'readwrite');
        transaction.objectStore(META_STORE).delete(META_KEY);
        transaction.objectStore(RECORD_STORE).clear();
        await transactionComplete(transaction);
        isClosed = true;
        database.close();
      },
      close() {
        if (isClosed) return;
        isClosed = true;
        database.close();
      },
    };
  } catch (error) {
    database.close();
    throw error;
  }
}
