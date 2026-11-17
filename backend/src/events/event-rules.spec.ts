import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import {
  assertTransition,
  assertValidDates,
} from './event-rules.js';

describe('event lifecycle', () => {
  it.each([
    [EventStatus.DRAFT, EventStatus.PUBLISHED],
    [EventStatus.DRAFT, EventStatus.CANCELLED],
    [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  ])('allows %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it.each([
    [EventStatus.PUBLISHED, EventStatus.DRAFT],
    [EventStatus.CANCELLED, EventStatus.DRAFT],
    [EventStatus.CANCELLED, EventStatus.PUBLISHED],
    [EventStatus.PUBLISHED, EventStatus.PUBLISHED],
    [EventStatus.CANCELLED, EventStatus.CANCELLED],
  ])('rejects %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(ConflictException);
  });
});

describe('event date rules', () => {
  it('requires the end to be after the start', () => {
    const start = new Date('2030-01-01T10:00:00Z');
    expect(() => assertValidDates(start, new Date('2030-01-01T10:00:00Z'))).toThrow(
      BadRequestException,
    );
    expect(() => assertValidDates(start, new Date('2030-01-01T09:00:00Z'))).toThrow(
      BadRequestException,
    );
    expect(() => assertValidDates(start, new Date('2030-01-01T11:00:00Z'))).not.toThrow();
  });
});
