import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, RegistrationStatus } from '@prisma/client';
import { lockEvent } from '../common/db.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  // The event row is locked so concurrent requests cannot take the same last place.
  register(eventId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await lockEvent(tx, eventId);

      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { status: true, startsAt: true, capacity: true },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      if (event.status !== EventStatus.PUBLISHED) {
        throw new ConflictException('Event is not open for registration');
      }
      if (event.startsAt <= new Date()) {
        throw new ConflictException('Event has already started');
      }

      const existing = await tx.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing?.status === RegistrationStatus.ACTIVE) {
        throw new ConflictException('You are already registered for this event');
      }

      const active = await tx.registration.count({
        where: { eventId, status: RegistrationStatus.ACTIVE },
      });
      if (active >= event.capacity) {
        throw new ConflictException('Event is full');
      }

      const select = {
        id: true,
        eventId: true,
        status: true,
        registeredAt: true,
      } as const;

      if (existing) {
        return tx.registration.update({
          where: { id: existing.id },
          data: {
            status: RegistrationStatus.ACTIVE,
            cancelledAt: null,
            registeredAt: new Date(),
          },
          select,
        });
      }
      return tx.registration.create({
        data: { eventId, userId, status: RegistrationStatus.ACTIVE },
        select,
      });
    });
  }

  async cancelOwn(eventId: string, userId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { startsAt: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const registration = await this.prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true, status: true },
    });
    if (registration?.status !== RegistrationStatus.ACTIVE) {
      throw new NotFoundException('You have no active registration for this event');
    }
    if (event.startsAt <= new Date()) {
      throw new ConflictException(
        'Registrations cannot be cancelled after the event has started',
      );
    }

    await this.prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    });
  }

  listOwn(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId, status: RegistrationStatus.ACTIVE },
      orderBy: { event: { startsAt: 'asc' } },
      select: {
        id: true,
        eventId: true,
        status: true,
        registeredAt: true,
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        },
      },
    });
  }
}
