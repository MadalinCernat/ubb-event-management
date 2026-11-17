import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma, RegistrationStatus } from '@prisma/client';
import { lockEvent } from '../common/db.js';
import { OrganizationAccessService } from '../organizations/organization-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { ListEventsQueryDto } from './dto/list-events-query.dto.js';
import type { UpdateEventDto } from './dto/update-event.dto.js';
import {
  assertTransition,
  assertValidDates,
} from './event-rules.js';

const eventInclude = {
  organization: { select: { id: true, name: true } },
  _count: {
    select: {
      registrations: { where: { status: RegistrationStatus.ACTIVE } },
    },
  },
} satisfies Prisma.EventInclude;

type EventWithCounts = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

// Public shape: contains no participant information, only counts.
function toView(event: EventWithCounts) {
  const registeredCount = event._count.registrations;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    capacity: event.capacity,
    status: event.status,
    organization: event.organization,
    registeredCount,
    availableSpots: Math.max(event.capacity - registeredCount, 0),
  };
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: OrganizationAccessService,
  ) {}

  async listPublished(query: ListEventsQueryDto) {
    const startsAtFilter: Prisma.DateTimeFilter = {};
    if (query.from) {
      startsAtFilter.gte = new Date(query.from);
    }
    if (query.to) {
      startsAtFilter.lte = new Date(query.to);
    }

    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
      ...(query.from || query.to ? { startsAt: startsAtFilter } : {}),
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { location: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: events.map((event) => toView(event)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  // Managers see every event of their organization, including drafts and cancelled ones.
  async listByOrganization(
    organizationId: string,
    userId: string,
    query: ListEventsQueryDto,
  ) {
    await this.access.assertManager(userId, organizationId);

    const where: Prisma.EventWhereInput = { organizationId };

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: events.map((event) => toView(event)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getById(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Unpublished events are visible only to the organization's managers.
    if (
      event.status !== EventStatus.PUBLISHED &&
      !(userId && (await this.access.isManager(userId, event.organizationId)))
    ) {
      throw new NotFoundException('Event not found');
    }

    return toView(event);
  }

  async create(organizationId: string, userId: string, dto: CreateEventDto) {
    await this.access.assertManager(userId, organizationId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    assertValidDates(startsAt, endsAt);

    const event = await this.prisma.event.create({
      data: {
        organizationId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startsAt,
        endsAt,
        capacity: dto.capacity,
        status: EventStatus.DRAFT,
        createdById: userId,
      },
      include: eventInclude,
    });
    return toView(event);
  }

  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.findManagedEvent(id, userId);

    if (event.status === EventStatus.CANCELLED) {
      throw new ConflictException('Cancelled events cannot be edited');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : event.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : event.endsAt;
    assertValidDates(startsAt, endsAt);

    return this.prisma.$transaction(async (tx) => {
      if (dto.capacity !== undefined) {
        await lockEvent(tx, id);
        const active = await tx.registration.count({
          where: { eventId: id, status: RegistrationStatus.ACTIVE },
        });
        if (dto.capacity < active) {
          throw new ConflictException(
            `Capacity cannot be lower than the ${active} active registrations`,
          );
        }
      }

      const updated = await tx.event.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          location: dto.location,
          startsAt: dto.startsAt ? startsAt : undefined,
          endsAt: dto.endsAt ? endsAt : undefined,
          capacity: dto.capacity,
        },
        include: eventInclude,
      });
      return toView(updated);
    });
  }

  publish(id: string, userId: string) {
    return this.changeStatus(id, userId, EventStatus.PUBLISHED);
  }

  cancel(id: string, userId: string) {
    return this.changeStatus(id, userId, EventStatus.CANCELLED);
  }

  private async changeStatus(id: string, userId: string, target: EventStatus) {
    const event = await this.findManagedEvent(id, userId);
    assertTransition(event.status, target);

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: target },
      include: eventInclude,
    });
    return toView(updated);
  }

  private async findManagedEvent(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    await this.access.assertManager(userId, event.organizationId);
    return event;
  }
}
