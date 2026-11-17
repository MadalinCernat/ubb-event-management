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

  it('validates event date rules and lifecycle transitions', async () => {
    const manager = await signUp('lmanager');
    const org = await request(server())
      .post('/organizations')
      .set('Authorization', manager)
      .send({ name: `${RUN} lifecycle-org`, description: 'Test' })
      .expect(201);
    const orgId = org.body.id as string;

    const start = Date.now() + 7 * 24 * 3600_000;

    // 1. End before start is rejected.
    await request(server())
      .post(`/organizations/${orgId}/events`)
      .set('Authorization', manager)
      .send({
        title: 'bad',
        description: 'D',
        location: 'L',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start - 1).toISOString(),
        capacity: 5,
      })
      .expect(400);

    // 2. End equal to start is rejected.
    await request(server())
      .post(`/organizations/${orgId}/events`)
      .set('Authorization', manager)
      .send({
        title: 'bad2',
        description: 'D',
        location: 'L',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start).toISOString(),
        capacity: 5,
      })
      .expect(400);

    // 3. Valid event is created as DRAFT.
    const created = await request(server())
      .post(`/organizations/${orgId}/events`)
      .set('Authorization', manager)
      .send({
        title: `${RUN} lifecycle event`,
        description: 'D',
        location: 'L',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + 3600_000).toISOString(),
        capacity: 5,
      })
      .expect(201);
    const eventId = created.body.id as string;
    expect(created.body.status).toBe('DRAFT');

    // 4. Cannot publish → published again (already published).
    await request(server()).post(`/events/${eventId}/publish`).set('Authorization', manager).expect(200);
    await request(server()).post(`/events/${eventId}/publish`).set('Authorization', manager).expect(409);

    // 5. Cannot publish a cancelled event.
    await request(server()).post(`/events/${eventId}/cancel`).set('Authorization', manager).expect(200);
    await request(server()).post(`/events/${eventId}/publish`).set('Authorization', manager).expect(409);

    // 6. Cannot cancel an already cancelled event.
    await request(server()).post(`/events/${eventId}/cancel`).set('Authorization', manager).expect(409);

    // 7. Cannot edit a cancelled event.
    await request(server())
      .patch(`/events/${eventId}`)
      .set('Authorization', manager)
      .send({ title: 'New title' })
      .expect(409);
  });

  it('enforces cross-organization authorization', async () => {
    const alice = await signUp('alice');
    const bob = await signUp('bob');

    const aliceOrg = await request(server())
      .post('/organizations')
      .set('Authorization', alice)
      .send({ name: `${RUN} alice-org`, description: 'Alice org' })
      .expect(201);

    await request(server())
      .post('/organizations')
      .set('Authorization', bob)
      .send({ name: `${RUN} bob-org`, description: 'Bob org' })
      .expect(201);

    const start = Date.now() + 7 * 24 * 3600_000;

    // Bob cannot create events for Alice's organization.
    await request(server())
      .post(`/organizations/${aliceOrg.body.id as string}/events`)
      .set('Authorization', bob)
      .send({
        title: 'Hijacked',
        description: 'D',
        location: 'L',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + 3600_000).toISOString(),
        capacity: 5,
      })
      .expect(403);

    // Bob cannot list Alice's organization events.
    await request(server())
      .get(`/organizations/${aliceOrg.body.id as string}/events`)
      .set('Authorization', bob)
      .expect(403);

    // Alice creates and publishes her event; Bob cannot manage it.
    const eventId = await createPublishedEvent(alice, aliceOrg.body.id as string, 5);

    await request(server())
      .patch(`/events/${eventId}`)
      .set('Authorization', bob)
      .send({ title: 'X' })
      .expect(403);

    await request(server())
      .post(`/events/${eventId}/cancel`)
      .set('Authorization', bob)
      .expect(403);
  });

  it('rejects registration on unpublished, cancelled, and past events', async () => {
    const manager = await signUp('rmanager');
    const student = await signUp('rstudent');

    const org = await request(server())
      .post('/organizations')
      .set('Authorization', manager)
      .send({ name: `${RUN} reg-edge-org`, description: 'T' })
      .expect(201);
    const orgId = org.body.id as string;

    const start = Date.now() + 7 * 24 * 3600_000;

    // Draft event: cannot register.
    const draft = await request(server())
      .post(`/organizations/${orgId}/events`)
      .set('Authorization', manager)
      .send({
        title: `${RUN} draft event`,
        description: 'D',
        location: 'L',
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(start + 3600_000).toISOString(),
        capacity: 5,
      })
      .expect(201);
    await request(server())
      .post(`/events/${draft.body.id as string}/registrations`)
      .set('Authorization', student)
      .expect(409);

    // Cancelled event: cannot register.
    const cancelledId = await createPublishedEvent(manager, orgId, 5);
    await request(server()).post(`/events/${cancelledId}/cancel`).set('Authorization', manager).expect(200);
    await request(server())
      .post(`/events/${cancelledId}/registrations`)
      .set('Authorization', student)
      .expect(409);

    // Past event (starts in the past): cannot register.
    const pastStart = new Date(Date.now() - 2 * 3600_000);
    const pastEnd = new Date(Date.now() - 3600_000);
    const pastEvent = await request(server())
      .post(`/organizations/${orgId}/events`)
      .set('Authorization', manager)
      .send({
        title: `${RUN} past event`,
        description: 'D',
        location: 'L',
        startsAt: pastStart.toISOString(),
        endsAt: pastEnd.toISOString(),
        capacity: 5,
      })
      .expect(201);
    await request(server()).post(`/events/${pastEvent.body.id as string}/publish`).set('Authorization', manager).expect(200);
    await request(server())
      .post(`/events/${pastEvent.body.id as string}/registrations`)
      .set('Authorization', student)
      .expect(409);

    // Past event: cannot cancel own registration either (never registered but also cannot cancel registration after event started).
    const pastEventId = pastEvent.body.id as string;
    await request(server())
      .delete(`/events/${pastEventId}/registrations/me`)
      .set('Authorization', student)
      .expect(404); // no active registration
  });

  it('lists own registrations', async () => {
    const manager = await signUp('lrmanager');
    const student = await signUp('lrstudent');

    const org = await request(server())
      .post('/organizations')
      .set('Authorization', manager)
      .send({ name: `${RUN} list-reg-org`, description: 'T' })
      .expect(201);
    const orgId = org.body.id as string;

    const eventId = await createPublishedEvent(manager, orgId, 10);
    const eventId2 = await createPublishedEvent(manager, orgId, 10);

    // Before registration: empty list.
    const empty = await request(server()).get('/registrations/me').set('Authorization', student).expect(200);
    expect(empty.body).toEqual([]);

    // Register for both events.
    await request(server()).post(`/events/${eventId}/registrations`).set('Authorization', student).expect(201);
    await request(server()).post(`/events/${eventId2}/registrations`).set('Authorization', student).expect(201);

    const list = await request(server()).get('/registrations/me').set('Authorization', student).expect(200);
    expect(list.body).toHaveLength(2);
    const ids = list.body.map((r: { eventId: string }) => r.eventId);
    expect(ids).toContain(eventId);
    expect(ids).toContain(eventId2);
    expect(list.body[0]).toHaveProperty('status', 'ACTIVE');
    expect(list.body[0]).toHaveProperty('event');

    // Cancel one: should no longer appear.
    await request(server()).delete(`/events/${eventId}/registrations/me`).set('Authorization', student).expect(204);
    const after = await request(server()).get('/registrations/me').set('Authorization', student).expect(200);
    expect(after.body).toHaveLength(1);
    expect(after.body[0].eventId).toBe(eventId2);
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
