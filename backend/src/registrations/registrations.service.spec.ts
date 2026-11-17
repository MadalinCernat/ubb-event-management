import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventStatus, RegistrationStatus } from '@prisma/client';
import { RegistrationsService } from './registrations.service.js';

const FUTURE = new Date(Date.now() + 7 * 24 * 3600_000);

function setup() {
  const prisma = {
    event: { findUnique: vi.fn() },
    registration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(prisma),
  );
  prisma.event.findUnique.mockResolvedValue({
    status: EventStatus.PUBLISHED,
    startsAt: FUTURE,
    capacity: 2,
    organizationId: 'o1',
  });
  prisma.registration.findUnique.mockResolvedValue(null);
  prisma.registration.count.mockResolvedValue(0);
  return { prisma, service: new RegistrationsService(prisma as never) };
}

describe('RegistrationsService.register', () => {
  it('locks the event and creates an active registration', async () => {
    const { prisma, service } = setup();
    prisma.registration.create.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });

    await service.register('e1', 'u1');

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.registration.create.mock.calls[0][0].data).toMatchObject({
      eventId: 'e1',
      userId: 'u1',
      status: RegistrationStatus.ACTIVE,
    });
  });

  it('takes the last available place', async () => {
    const { prisma, service } = setup();
    prisma.registration.count.mockResolvedValue(1);
    prisma.registration.create.mockResolvedValue({ id: 'r1' });
    await expect(service.register('e1', 'u1')).resolves.toBeDefined();
  });

  it('rejects registration when the event is full', async () => {
    const { prisma, service } = setup();
    prisma.registration.count.mockResolvedValue(2);

    await expect(service.register('e1', 'u1')).rejects.toThrow('Event is full');
    expect(prisma.registration.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate active registration', async () => {
    const { prisma, service } = setup();
    prisma.registration.findUnique.mockResolvedValue({
      id: 'r1',
      status: RegistrationStatus.ACTIVE,
    });
    await expect(service.register('e1', 'u1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.registration.create).not.toHaveBeenCalled();
  });

  it.each([EventStatus.DRAFT, EventStatus.CANCELLED])(
    'rejects registration for a %s event',
    async (status) => {
      const { prisma, service } = setup();
      prisma.event.findUnique.mockResolvedValue({
        status,
        startsAt: FUTURE,
        capacity: 2,
      });
      await expect(service.register('e1', 'u1')).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('rejects registration for an event that has started', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({
      status: EventStatus.PUBLISHED,
      startsAt: new Date(Date.now() - 1000),
      capacity: 2,
    });
    await expect(service.register('e1', 'u1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 for an unknown event', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(service.register('e1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reactivates a previously cancelled registration', async () => {
    const { prisma, service } = setup();
    prisma.registration.findUnique.mockResolvedValue({
      id: 'r1',
      status: RegistrationStatus.CANCELLED,
    });
    prisma.registration.update.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });

    await service.register('e1', 'u1');

    expect(prisma.registration.update.mock.calls[0][0].data).toMatchObject({
      status: RegistrationStatus.ACTIVE,
      cancelledAt: null,
    });
    expect(prisma.registration.create).not.toHaveBeenCalled();
  });
});

describe('RegistrationsService.cancelOwn', () => {
  it('cancels the caller\'s own active registration', async () => {
    const { prisma, service } = setup();
    prisma.registration.findUnique.mockResolvedValue({
      id: 'r1',
      status: RegistrationStatus.ACTIVE,
    });

    await service.cancelOwn('e1', 'u1');

    expect(prisma.registration.findUnique.mock.calls[0][0].where).toEqual({
      eventId_userId: { eventId: 'e1', userId: 'u1' },
    });
    expect(prisma.registration.update.mock.calls[0][0].data).toMatchObject({
      status: RegistrationStatus.CANCELLED,
    });
  });

  it('returns 404 when the caller has no active registration', async () => {
    const { prisma, service } = setup();
    prisma.registration.findUnique.mockResolvedValue(null);
    await expect(service.cancelOwn('e1', 'u1')).rejects.toBeInstanceOf(NotFoundException);

    prisma.registration.findUnique.mockResolvedValue({
      id: 'r1',
      status: RegistrationStatus.CANCELLED,
    });
    await expect(service.cancelOwn('e1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects cancellation after the event has started', async () => {
    const { prisma, service } = setup();
    prisma.event.findUnique.mockResolvedValue({ startsAt: new Date(Date.now() - 1000) });
    prisma.registration.findUnique.mockResolvedValue({
      id: 'r1',
      status: RegistrationStatus.ACTIVE,
    });
    await expect(service.cancelOwn('e1', 'u1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.registration.update).not.toHaveBeenCalled();
  });
});
