import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

export const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Requires an explicit timezone so stored timestamps are unambiguous (UTC).
export function IsUtcDateTime(): PropertyDecorator {
  return applyDecorators(
    IsISO8601({ strict: true }),
    Matches(/(Z|[+-]\d{2}:\d{2})$/, {
      message:
        '$property must include a timezone, for example 2027-03-20T16:00:00Z',
    }),
  );
}
