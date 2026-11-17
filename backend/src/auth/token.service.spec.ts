import { TokenService } from './token.service.js';

describe('TokenService', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN_SECONDS = '60';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the user id for a token it signed', () => {
    const tokens = new TokenService();
    expect(tokens.verify(tokens.sign('user-1').accessToken)).toBe('user-1');
  });

  it('rejects a token with a tampered payload', () => {
    const tokens = new TokenService();
    const [header, , signature] = tokens.sign('user-1').accessToken.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: 'admin', exp: 9999999999 }),
    ).toString('base64url');
    expect(tokens.verify(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it('rejects a token signed with another secret', () => {
    const accessToken = new TokenService().sign('user-1').accessToken;
    process.env.JWT_SECRET = 'other-secret';
    expect(new TokenService().verify(accessToken)).toBeNull();
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    const tokens = new TokenService();
    const { accessToken } = tokens.sign('user-1');
    vi.advanceTimersByTime(61_000);
    expect(tokens.verify(accessToken)).toBeNull();
  });

  it('rejects malformed input', () => {
    const tokens = new TokenService();
    expect(tokens.verify('garbage')).toBeNull();
    expect(tokens.verify('a.b.c')).toBeNull();
  });
});
