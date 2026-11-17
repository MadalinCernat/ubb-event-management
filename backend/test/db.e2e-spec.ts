import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// Needs PostgreSQL with migrations applied. Run with:
//   $env:RUN_DB_TESTS='true'; npm run test:e2e
const enabled = process.env.RUN_DB_TESTS === 'true';
const RUN = `dbe2e${Date.now().toString(36)}`;

describe.skipIf(!enabled)('Event workflow against PostgreSQL (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const server = () => app.getHttpServer();

  async function signUp(name: string): Promise<string> {
    const response = await request(server())
      .post('/auth/register')
      .send({
        email: `${name}.${RUN}@db-e2e.test`,
        password: 'secret-pass',
        displayName: name,
      })
      .expect(201);
    return `Bearer ${response.body.accessToken as string}`;
  }

  async function createPublishedEvent(manager: string, orgId: string, capacity: number) {
    const start = Date.now() + 7 * 24 * 3600_000;
    const created = await request(server())
      .post(`/organizations/${orgId}/events`)
      .set('Authorization', manager)
      .send({
        title: `${RUN} event`,
        description: 'Integration test event',
        location: 'Room 1',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + 3600_000).toISOString(),
        capacity,
      })
      .expect(201);
    await request(server())
      .post(`/events/${created.body.id as string}/publish`)
      .set('Authorization', manager)
      .expect(200);
    return created.body.id as string;
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = 'db-e2e-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (!app) {
      return;
    }
    await prisma.event.deleteMany({ where: { organization: { name: { startsWith: RUN } } } });
    await prisma.organization.deleteMany({ where: { name: { startsWith: RUN } } });
    await prisma.user.deleteMany({ where: { email: { contains: RUN } } });
    await app.close();
  });

  it('covers sign-up, organization, event lifecycle, discovery and registration', async () => {
    const manager = await signUp('manager');
    const student = await signUp('student');
    const other = await signUp('other');

    const org = await request(server())
      .post('/organizations')
      .set('Authorization', manager)
      .send({ name: `${RUN} org`, description: 'Test organization' })
      .expect(201);

    const me = await request(server()).get('/auth/me').set('Authorization', manager).expect(200);
    expect(me.body.memberships[0]).toMatchObject({ organizationId: org.body.id, role: 'MANAGER' });

    // A non-member cannot manage the organization's events.
    await request(server())
      .post(`/organizations/${org.body.id as string}/events`)
      .set('Authorization', student)
      .send({
        title: 'x',
        description: 'x',
        location: 'x',
        startsAt: new Date(Date.now() + 1e9).toISOString(),
        endsAt: new Date(Date.now() + 1e9 + 3600_000).toISOString(),
        capacity: 1,
      })
      .expect(403);

    const eventId = await createPublishedEvent(manager, org.body.id as string, 1);

    const list = await request(server()).get(`/events?q=${RUN}`).expect(200);
    expect(list.body.items.map((event: { id: string }) => event.id)).toContain(eventId);

    await request(server())
      .post(`/events/${eventId}/registrations`)
      .set('Authorization', student)
      .expect(201);
    await request(server())
      .post(`/events/${eventId}/registrations`)
      .set('Authorization', student)
      .expect(409);
    await request(server())
      .post(`/events/${eventId}/registrations`)
      .set('Authorization', other)
      .expect(409);

    // Public event data exposes counts but no participants.
    const publicView = await request(server()).get(`/events/${eventId}`).expect(200);
    expect(publicView.body).toMatchObject({ registeredCount: 1, availableSpots: 0 });
    expect(JSON.stringify(publicView.body)).not.toContain('student.');

    await request(server())
      .delete(`/events/${eventId}/registrations/me`)
      .set('Authorization', student)
      .expect(204);
    await request(server())
      .post(`/events/${eventId}/registrations`)
      .set('Authorization', other)
      .expect(201);
  });

  it('never overbooks the last place under concurrent requests', async () => {
    const manager = await signUp('cmanager');
    const org = await request(server())
      .post('/organizations')
      .set('Authorization', manager)
      .send({ name: `${RUN} concurrency`, description: 'Test organization' })
      .expect(201);
    const eventId = await createPublishedEvent(manager, org.body.id as string, 2);

    const tokens: string[] = [];
    for (let index = 0; index < 8; index += 1) {
      tokens.push(await signUp(`racer${index}`));
    }

    const responses = await Promise.all(
      tokens.map((token) =>
        request(server()).post(`/events/${eventId}/registrations`).set('Authorization', token),
      ),
    );

    const statuses = responses.map((response) => response.status);
    expect(statuses.filter((status) => status === 201)).toHaveLength(2);
    expect(statuses.filter((status) => status === 409)).toHaveLength(6);
    expect(
      await prisma.registration.count({ where: { eventId, status: 'ACTIVE' } }),
    ).toBe(2);
  });
});
