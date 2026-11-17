import { scryptSync } from 'node:crypto';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the password it hashed and never stores it in plain text', () => {
    const hash = hashPassword('correct horse');
    expect(hash).not.toContain('correct horse');
    expect(verifyPassword('correct horse', hash)).toBe(true);
  });

  it('rejects a wrong password', () => {
    expect(verifyPassword('wrong', hashPassword('correct horse'))).toBe(false);
  });

  it('uses a different salt for each hash', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('verifies hashes written by prisma/seed.ts', () => {
    const salt = 'ubb-event-management-demo';
    const seeded = `scrypt$${salt}$${scryptSync('password', salt, 64).toString('hex')}`;
    expect(verifyPassword('password', seeded)).toBe(true);
  });

  it('rejects malformed stored hashes', () => {
    expect(verifyPassword('x', 'plain')).toBe(false);
    expect(verifyPassword('x', 'scrypt$salt$')).toBe(false);
  });
});
