import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';

const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [EventStatus.CANCELLED],
  [EventStatus.CANCELLED]: [],
};

export function assertTransition(from: EventStatus, to: EventStatus): void {
  if (from === to) {
    throw new ConflictException(`Event is already ${from.toLowerCase()}`);
  }
  if (!TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Cannot change an event from ${from} to ${to}`,
    );
  }
}

export function assertValidDates(startsAt: Date, endsAt: Date): void {
  if (endsAt <= startsAt) {
    throw new BadRequestException('endsAt must be later than startsAt');
  }
}
