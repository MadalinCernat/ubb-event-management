import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getJwtSecret, getJwtTtlSeconds } from '../config.js';

const HEADER = Buffer.from(
  JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
).toString('base64url');

@Injectable()
export class TokenService {
  private readonly secret = getJwtSecret();

  sign(userId: string): { accessToken: string; expiresIn: number } {
    const expiresIn = getJwtTtlSeconds();
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({ sub: userId, iat: issuedAt, exp: issuedAt + expiresIn }),
    ).toString('base64url');
    const signature = this.signature(`${HEADER}.${payload}`);
    return { accessToken: `${HEADER}.${payload}.${signature}`, expiresIn };
  }

  // Returns the user id, or null when the token is malformed, forged or expired.
  verify(token: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== HEADER) {
      return null;
    }
    const expected = Buffer.from(this.signature(`${parts[0]}.${parts[1]}`));
    const actual = Buffer.from(parts[2]);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      ) as { sub?: unknown; exp?: unknown };
      const notExpired =
        typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
      return notExpired && typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }

  private signature(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('base64url');
  }
}
