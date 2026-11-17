import { scryptSync } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  EventStatus,
  MembershipRole,
  PrismaClient,
  RegistrationStatus,
} from '@prisma/client';

if (process.loadEnvFile) {
  try {
    process.loadEnvFile('.env');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:password@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function demoPasswordHash(password: string): string {
  const salt = 'ubb-event-management-demo';
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

const ids = {
  manager: '11111111-1111-4111-8111-111111111111',
  student: '22222222-2222-4222-8222-222222222222',
  organization: '33333333-3333-4333-8333-333333333333',
  publishedEvent: '44444444-4444-4444-8444-444444444444',
  draftEvent: '55555555-5555-4555-8555-555555555555',
};

async function main(): Promise<void> {
  const passwordHash = demoPasswordHash('password');

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: { displayName: 'Demo Manager', passwordHash },
    create: {
      id: ids.manager,
      email: 'manager@example.com',
      displayName: 'Demo Manager',
      passwordHash,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: { displayName: 'Demo Student', passwordHash },
    create: {
      id: ids.student,
      email: 'student@example.com',
      displayName: 'Demo Student',
      passwordHash,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { name: 'UBB Demo Organization' },
    update: {
      description: 'Fictional organization used for local development.',
      createdById: manager.id,
    },
    create: {
      id: ids.organization,
      name: 'UBB Demo Organization',
      description: 'Fictional organization used for local development.',
      createdById: manager.id,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: manager.id,
        organizationId: organization.id,
      },
    },
    update: { role: MembershipRole.MANAGER },
    create: {
      userId: manager.id,
      organizationId: organization.id,
      role: MembershipRole.MANAGER,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: student.id,
        organizationId: organization.id,
      },
    },
    update: { role: MembershipRole.MEMBER },
    create: {
      userId: student.id,
      organizationId: organization.id,
      role: MembershipRole.MEMBER,
    },
  });

  const publishedEvent = await prisma.event.upsert({
    where: { id: ids.publishedEvent },
    update: {},
    create: {
      id: ids.publishedEvent,
      organizationId: organization.id,
      title: 'Demo Student Meetup',
      description: 'A fictional published event for local development.',
      location: 'UBB FSEGA, Room 101',
      startsAt: new Date('2027-03-20T16:00:00.000Z'),
      endsAt: new Date('2027-03-20T18:00:00.000Z'),
      capacity: 50,
      status: EventStatus.PUBLISHED,
      createdById: manager.id,
    },
  });

  await prisma.event.upsert({
    where: { id: ids.draftEvent },
    update: {},
    create: {
      id: ids.draftEvent,
      organizationId: organization.id,
      title: 'Draft Workshop',
      description: 'A fictional draft event for organizer testing.',
      location: 'UBB FSEGA, Lab 2',
      startsAt: new Date('2027-04-10T12:00:00.000Z'),
      endsAt: new Date('2027-04-10T14:00:00.000Z'),
      capacity: 25,
      status: EventStatus.DRAFT,
      createdById: manager.id,
    },
  });

  await prisma.registration.upsert({
    where: {
      eventId_userId: {
        eventId: publishedEvent.id,
        userId: student.id,
      },
    },
    update: {
      status: RegistrationStatus.ACTIVE,
      cancelledAt: null,
    },
    create: {
      eventId: publishedEvent.id,
      userId: student.id,
      status: RegistrationStatus.ACTIVE,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
