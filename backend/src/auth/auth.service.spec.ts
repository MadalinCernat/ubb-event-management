import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hashPassword, verifyPassword } from '../common/password.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';

function setup() {
  process.env.JWT_SECRET = 'test-secret';
  const prisma = { user: { create: vi.fn(), findUnique: vi.fn() } };
  const tokens = new TokenService();
  return { prisma, tokens, service: new AuthService(prisma as never, tokens) };
}

describe('AuthService', () => {
  it('registers a user with a hashed password and returns a usable token', async () => {
    const { prisma, tokens, service } = setup();
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ana',
    });

    const session = await service.register({
      email: 'a@b.com',
      password: 'secret-pass',
      displayName: 'Ana',
    });

    const stored = prisma.user.create.mock.calls[0][0].data.passwordHash as string;
    expect(stored).not.toContain('secret-pass');
    expect(verifyPassword('secret-pass', stored)).toBe(true);
    expect(tokens.verify(session.accessToken)).toBe('u1');
    expect(session.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email with 409', async () => {
    const { prisma, service } = setup();
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({ email: 'a@b.com', password: 'secret-pass', displayName: 'Ana' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('signs in with the right password', async () => {
    const { prisma, tokens, service } = setup();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ana',
      passwordHash: hashPassword('secret-pass'),
    });

    const session = await service.login({ email: 'a@b.com', password: 'secret-pass' });
    expect(tokens.verify(session.accessToken)).toBe('u1');
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ana',
      passwordHash: hashPassword('secret-pass'),
    });
    const wrongPassword = await service
      .login({ email: 'a@b.com', password: 'nope' })
      .catch((error: unknown) => error);

    prisma.user.findUnique.mockResolvedValueOnce(null);
    const unknownEmail = await service
      .login({ email: 'x@y.com', password: 'nope' })
      .catch((error: unknown) => error);

    expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
    expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
    expect((wrongPassword as Error).message).toBe((unknownEmail as Error).message);
  });

  it('returns the current user with organization memberships', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ana',
      memberships: [{ role: 'MANAGER', organization: { id: 'o1', name: 'Org' } }],
    });

    await expect(service.me('u1')).resolves.toEqual({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Ana',
      memberships: [{ organizationId: 'o1', organizationName: 'Org', role: 'MANAGER' }],
    });
  });
});
