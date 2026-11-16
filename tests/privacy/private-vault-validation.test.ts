import { describe, expect, it } from 'vitest';
import { isValidVaultRecordId, validateVaultPassphrase } from '@/lib/privacy/private-vault';

describe('private vault passphrase validation', () => {
  it('requires a sufficiently long passphrase', () => {
    expect(validateVaultPassphrase('short')).toBeTruthy();
    expect(validateVaultPassphrase('correct horse battery')).toBeNull();
  });
  it('rejects whitespace-only padding and overly long input', () => {
    expect(validateVaultPassphrase('            ')).toBeTruthy();
    expect(validateVaultPassphrase('x'.repeat(257))).toBeTruthy();
  });
});


describe('private vault record identifiers', () => {
  it('accepts stable journey keys and generated UUID identifiers', () => {
    expect(isValidVaultRecordId('journey:self')).toBe(true);
    expect(isValidVaultRecordId('journal:550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
  it('rejects missing namespaces and unsafe identifier characters', () => {
    expect(isValidVaultRecordId('self')).toBe(false);
    expect(isValidVaultRecordId('journal:../private')).toBe(false);
    expect(isValidVaultRecordId('journal:')).toBe(false);
  });
});
