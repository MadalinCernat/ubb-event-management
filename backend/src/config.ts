const DEV_JWT_SECRET = 'dev-only-secret-change-me';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_JWT_SECRET;
}

export function getJwtTtlSeconds(): number {
  const value = Number(process.env.JWT_EXPIRES_IN_SECONDS);
  return Number.isInteger(value) && value > 0 ? value : 3600;
}
