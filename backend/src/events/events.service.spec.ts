import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service.js';

const FUTURE = new Date(Date.now() + 7 * 24 * 3600_000);
const FUTURE_END = new Date(FUTURE.getTime() + 2 * 3600_000);

function eventRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e1',
    organizationId: 'o1',
    title: 'Meetup',
    description: 'Desc',
    location: 'Room 1',
    startsAt: FUTURE,
    endsAt: FUTURE_END,
    capacity: 10,
    status: EventStatus.DRAFT,
    createdById: 'u1',
    organization: { id: 'o1', name: 'Org' },
    _count: { registrations: 0 },
    ...overrides,
  };
}

function setup() {
  const prisma = {
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    registration: { findUnique: vi.fn(), count: vi.fn() },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(prisma),
  );
  const access = { assertManager: vi.fn(), isManager: vi.fn() };
  return {
    prisma,
    access,
    service: new EventsService(prisma as never, access as never),
  };
}

const validDto = {
  title: 'Meetup',
  description: 'Desc',
  location: 'Room 1',
  startsAt: FUTURE.toISOString(),
  endsAt: FUTURE_END.toISOString(),
  capacity: 10,
};

describe('EventsService.create', () => {
  it('creates a draft owned by the caller', async () => {
    const { prisma, service } = setup();
    prisma.event.create.mockResolvedValue(eventRow());

    await service.create('o1', 'u1', validDto);

    const data = prisma.event.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      organizationId: 'o1',
      createdById: 'u1',
      status: EventStatus.DRAFT,
    });
    expect(data.startsAt).toBeInstanceOf(Date);
  });

  it('does not create anything when the caller is not a manager', async () => {
    const { prisma, access, service } = setup();
    access.assertManager.mockRejectedValue(new ForbiddenException());

    await expect(service.create('o1', 'u2', validDto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('rejects an end time that is not after the start time', async () => {
    const { service } = setup();
    await expect(
      service.create('o1', 'u1', { ...validDto, endsAt: validDto.startsAt }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('EventsService.update', () => {
  it('rejects edits by non-managers', async () => {
    const { prisma, access, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    access.assertManager.mockRejectedValue(new ForbiddenException());

    await expect(service.update('e1', 'u2', { title: 'X' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects edits to cancelled events', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(
      eventRow({ status: EventStatus.CANCELLED }),
    );
    await expect(service.update('e1', 'u1', { title: 'X' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an end time before the existing start time', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    await expect(
      service.update('e1', 'u1', { endsAt: new Date(FUTURE.getTime() - 1000).toISOString() }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a capacity lower than the active registrations', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(
      eventRow({ status: EventStatus.PUBLISHED }),
    );
    prisma.registration.count.mockResolvedValue(5);

    await expect(service.update('e1', 'u1', { capacity: 4 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('updates the event when the changes are valid', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    prisma.registration.count.mockResolvedValue(2);
    prisma.event.update.mockResolvedValue(eventRow({ capacity: 20 }));

    const result = await service.update('e1', 'u1', { capacity: 20 });

    expect(result.capacity).toBe(20);
    expect(prisma.event.update.mock.calls[0][0].data.capacity).toBe(20);
  });
});

describe('EventsService lifecycle', () => {
  it('publishes a draft', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    prisma.event.update.mockResolvedValue(eventRow({ status: EventStatus.PUBLISHED }));

    const result = await service.publish('e1', 'u1');

    expect(result.status).toBe(EventStatus.PUBLISHED);
    expect(prisma.event.update.mock.calls[0][0].data).toEqual({
      status: EventStatus.PUBLISHED,
    });
  });

  it.each([EventStatus.PUBLISHED, EventStatus.CANCELLED])(
    'cannot publish an event that is %s',
    async (status) => {
      const { prisma, service } = setup();
      prisma.event.findUnique.mockResolvedValue(eventRow({ status }));
      await expect(service.publish('e1', 'u1')).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it.each([EventStatus.DRAFT, EventStatus.PUBLISHED])('cancels a %s event', async (status) => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow({ status }));
    prisma.event.update.mockResolvedValue(eventRow({ status: EventStatus.CANCELLED }));

    await expect(service.cancel('e1', 'u1')).resolves.toMatchObject({
      status: EventStatus.CANCELLED,
    });
  });

  it('cannot cancel an already cancelled event', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow({ status: EventStatus.CANCELLED }));
    await expect(service.cancel('e1', 'u1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects lifecycle changes by non-managers', async () => {
    const { prisma, access, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    access.assertManager.mockRejectedValue(new ForbiddenException());
    await expect(service.publish('e1', 'u2')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});

describe('EventsService.getById', () => {
  it('hides unpublished events from anonymous users', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    await expect(service.getById('e1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides unpublished events from users who are not managers', async () => {
    const { prisma, access, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    access.isManager.mockResolvedValue(false);
    await expect(service.getById('e1', 'u2')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shows unpublished events to managers', async () => {
    const { prisma, access, service } = setup();
    prisma.event.findUnique.mockResolvedValue(eventRow());
    access.isManager.mockResolvedValue(true);
    await expect(service.getById('e1', 'u1')).resolves.toMatchObject({ id: 'e1' });
  });

  it('shows published events to anyone, with availability and without private data', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(
      eventRow({ status: EventStatus.PUBLISHED, _count: { registrations: 4 } }),
    );

    const view = await service.getById('e1');

    expect(view).toMatchObject({
      registeredCount: 4,
      availableSpots: 6,
    });
    expect(view).not.toHaveProperty('createdById');
    expect(view).not.toHaveProperty('registrations');
  });
});

describe('EventsService.listByOrganization', () => {
  it('lists every event of the organization for a manager, regardless of status', async () => {
    const { prisma, access, service } = setup();
    access.assertManager.mockResolvedValue(undefined);
    prisma.event.count.mockResolvedValue(2);
    prisma.event.findMany.mockResolvedValue([
      eventRow({ status: EventStatus.DRAFT }),
      eventRow({ id: 'e2', status: EventStatus.CANCELLED }),
    ]);

    const result = await service.listByOrganization('o1', 'u1', {
      page: 1,
      pageSize: 20,
    });

    expect(access.assertManager).toHaveBeenCalledWith('u1', 'o1');
    const args = prisma.event.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ organizationId: 'o1' });
    expect(args.where.status).toBeUndefined();
    expect(result).toMatchObject({ total: 2, page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(2);
  });

  it('does not query events when the caller is not a manager', async () => {
    const { prisma, access, service } = setup();
    access.assertManager.mockRejectedValue(new ForbiddenException());

    await expect(
      service.listByOrganization('o1', 'u2', { page: 1, pageSize: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.findMany).not.toHaveBeenCalled();
  });
});

describe('EventsService.listPublished', () => {
  it('lists only published events with pagination and filters', async () => {
    const { prisma, service } = setup();
    prisma.event.count.mockResolvedValue(45);
    prisma.event.findMany.mockResolvedValue([
      eventRow({ status: EventStatus.PUBLISHED }),
    ]);

    const result = await service.listPublished({
      q: 'git',
      organizationId: 'o1',
      page: 3,
      pageSize: 10,
    });

    const args = prisma.event.findMany.mock.calls[0][0];
    expect(args.where.status).toBe(EventStatus.PUBLISHED);
    expect(args.where.organizationId).toBe('o1');
    expect(args.where.OR).toHaveLength(3);
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
    expect(result).toMatchObject({ total: 45, page: 3, pageSize: 10 });
    expect(result.items).toHaveLength(1);
  });
});
