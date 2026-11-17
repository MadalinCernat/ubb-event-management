import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthService } from './../src/auth/auth.service.js';
import { TokenService } from './../src/auth/token.service.js';
import { EventsService } from './../src/events/events.service.js';
import { OrganizationsService } from './../src/organizations/organizations.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { RegistrationsService } from './../src/registrations/registrations.service.js';

// HTTP contract tests: real guard, pipes and error filter; services are mocked.
const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = '22222222-2222-4222-8222-222222222222';

describe('HTTP API contract (e2e)', () => {
  let app: INestApplication<App>;
  let bearer: string;

  const auth = { register: vi.fn(), login: vi.fn(), me: vi.fn() };
  const organizations = { create: vi.fn(), addMember: vi.fn() };
  const events = {
    listPublished: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    cancel: vi.fn(),
  };
  const registrations = {
    register: vi.fn(),
    cancelOwn: vi.fn(),
    listOwn: vi.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue(auth)
      .overrideProvider(OrganizationsService)
      .useValue(organizations)
      .overrideProvider(EventsService)
      .useValue(events)
      .overrideProvider(RegistrationsService)
      .useValue(registrations)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    bearer = `Bearer ${moduleRef.get(TokenService).sign('user-1').accessToken}`;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('authentication', () => {
    it('returns 401 with the standard error shape when no token is sent', async () => {
      const response = await request(app.getHttpServer()).post('/organizations').send({});
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Authentication required',
        error: 'Unauthorized',
      });
    });

    it('returns 401 for an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not-a-token')
        .expect(401);
    });

    it.each([
      ['get', '/auth/me'],
      ['post', '/auth/logout'],
      ['get', '/registrations/me'],
      ['post', `/events/${EVENT_ID}/registrations`],
      ['delete', `/events/${EVENT_ID}/registrations/me`],
      ['post', `/events/${EVENT_ID}/publish`],
      ['post', `/events/${EVENT_ID}/cancel`],
      ['patch', `/events/${EVENT_ID}`],
      ['post', `/organizations/${ORG_ID}/events`],
      ['post', `/organizations/${ORG_ID}/members`],
    ] as const)('protects %s %s', async (method, path) => {
      await request(app.getHttpServer())[method](path).expect(401);
    });

    it('registers (201), logs in (200) and logs out (204)', async () => {
      auth.register.mockResolvedValue({ accessToken: 't' });
      auth.login.mockResolvedValue({ accessToken: 't' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: ' Ana@Example.COM ', password: 'secret-pass', displayName: ' Ana ' })
        .expect(201);
      expect(auth.register).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'secret-pass',
        displayName: 'Ana',
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ana@example.com', password: 'secret-pass' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', bearer)
        .expect(204);
    });

    it('rejects a weak password and an invalid email with 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'nope', password: 'short', displayName: 'Ana' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(auth.register).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('rejects unknown properties so clients cannot set ids or roles', async () => {
      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', bearer)
        .send({ name: 'Org', description: 'D', createdById: 'someone-else' })
        .expect(400);
      expect(organizations.create).not.toHaveBeenCalled();
    });

    it('rejects an invalid event payload', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${ORG_ID}/events`)
        .set('Authorization', bearer)
        .send({
          title: 'T',
          description: 'D',
          location: 'L',
          startsAt: '2030-01-01T10:00:00',
          endsAt: '2030-01-01T12:00:00Z',
          capacity: 0,
        });
      expect(response.status).toBe(400);
      expect(response.body.message.join(' ')).toMatch(/startsAt/);
      expect(response.body.message.join(' ')).toMatch(/capacity/);
      expect(events.create).not.toHaveBeenCalled();
    });

    it('rejects malformed ids with 400', async () => {
      await request(app.getHttpServer()).get('/events/not-a-uuid').expect(400);
    });

    it('rejects out-of-range pagination and unknown query parameters', async () => {
      await request(app.getHttpServer()).get('/events?pageSize=500').expect(400);
      await request(app.getHttpServer()).get('/events?sort=evil').expect(400);
    });
  });

  describe('events', () => {
    it('lists published events without authentication and applies defaults', async () => {
      events.listPublished.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });

      await request(app.getHttpServer()).get('/events?q=git').expect(200);

      expect(events.listPublished).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'git', page: 1, pageSize: 20 }),
      );
    });

    it('passes the caller identity from the token, never from the request', async () => {
      events.create.mockResolvedValue({ id: EVENT_ID });
      const body = {
        title: 'T',
        description: 'D',
        location: 'L',
        startsAt: '2030-01-01T10:00:00Z',
        endsAt: '2030-01-01T12:00:00Z',
        capacity: 5,
      };

      await request(app.getHttpServer())
        .post(`/organizations/${ORG_ID}/events`)
        .set('Authorization', bearer)
        .send(body)
        .expect(201);

      expect(events.create).toHaveBeenCalledWith(ORG_ID, 'user-1', body);
    });

    it('treats an event detail request as anonymous without a token and identified with one', async () => {
      events.getById.mockResolvedValue({ id: EVENT_ID });

      await request(app.getHttpServer()).get(`/events/${EVENT_ID}`).expect(200);
      expect(events.getById).toHaveBeenLastCalledWith(EVENT_ID, undefined);

      await request(app.getHttpServer())
        .get(`/events/${EVENT_ID}`)
        .set('Authorization', bearer)
        .expect(200);
      expect(events.getById).toHaveBeenLastCalledWith(EVENT_ID, 'user-1');
    });

    it('returns 200 for publish and cancel', async () => {
      events.publish.mockResolvedValue({ id: EVENT_ID });
      events.cancel.mockResolvedValue({ id: EVENT_ID });
      await request(app.getHttpServer())
        .post(`/events/${EVENT_ID}/publish`)
        .set('Authorization', bearer)
        .expect(200);
      await request(app.getHttpServer())
        .post(`/events/${EVENT_ID}/cancel`)
        .set('Authorization', bearer)
        .expect(200);
    });
  });

  describe('registrations', () => {
    it('registers with 201 and cancels own registration with 204', async () => {
      registrations.register.mockResolvedValue({ id: 'r1' });
      registrations.cancelOwn.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post(`/events/${EVENT_ID}/registrations`)
        .set('Authorization', bearer)
        .expect(201);
      expect(registrations.register).toHaveBeenCalledWith(EVENT_ID, 'user-1');

      await request(app.getHttpServer())
        .delete(`/events/${EVENT_ID}/registrations/me`)
        .set('Authorization', bearer)
        .expect(204);
      expect(registrations.cancelOwn).toHaveBeenCalledWith(EVENT_ID, 'user-1');
    });
  });

  describe('error shape', () => {
    it('returns 403 in the standard shape when authorization fails', async () => {
      events.publish.mockRejectedValue(new ForbiddenException('Managers only'));

      const response = await request(app.getHttpServer())
        .post(`/events/${EVENT_ID}/publish`)
        .set('Authorization', bearer);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        statusCode: 403,
        message: 'Managers only',
        error: 'Forbidden',
      });
    });

    it('returns 404 in the standard shape for unknown routes', async () => {
      const response = await request(app.getHttpServer()).get('/nothing-here');
      expect(response.status).toBe(404);
      expect(Object.keys(response.body).sort()).toEqual(['error', 'message', 'statusCode']);
    });

    it('hides internal details of unexpected errors', async () => {
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      events.listPublished.mockRejectedValue(new Error('connection password=hunter2'));

      const response = await request(app.getHttpServer()).get('/events');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    });
  });
});
