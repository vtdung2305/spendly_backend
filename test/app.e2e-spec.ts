import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { MailQueueService } from '../src/modules/mail/queue/mail-queue.service';

/**
 * Requires a real Postgres/Redis reachable via the env vars in `.env` (a real
 * Cloudinary account is only needed for the Files module, not this auth flow)
 * (e.g. `docker compose up -d db redis` then `npx prisma migrate deploy`).
 * Not run as part of `npm test` — see `npm run test:e2e`.
 *
 * MailQueueService is overridden with a capturing mock so the test doesn't need
 * a real inbox to read the OTP email — it exercises the full HTTP/DB flow up to
 * (but not including) actual SMTP delivery, which `mail.processor.ts` owns.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `e2e-${Date.now()}@spendly.app`;
  let capturedOtp = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailQueueService)
      .useValue({
        queueEmailOtp: jest.fn(async (data: { code: string }) => {
          capturedOtp = data.code;
        }),
        queuePasswordReset: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user and sends an OTP instead of a session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', firstName: 'E2E', lastName: 'Test' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ userId: expect.any(String), email, otpRequired: true });
    expect(res.body.data.accessToken).toBeUndefined();
    expect(capturedOtp).toMatch(/^\d{6}$/);
  });

  it('rejects login before the OTP has been verified', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Passw0rd1' })
      .expect(403);

    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('rejects an incorrect OTP', async () => {
    const wrongOtp = capturedOtp === '000000' ? '111111' : '000000';
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ email, code: wrongOtp })
      .expect(400);

    expect(res.body.error.code).toBe('OTP_INVALID_OR_EXPIRED');
  });

  it('verifies the OTP and returns a session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ email, code: capturedOtp })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects a duplicate registration with 409 EMAIL_ALREADY_EXISTS now that the email is verified', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'Passw0rd1', firstName: 'E2E', lastName: 'Test' })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('logs in with the verified credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Passw0rd1' })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects wrong credentials with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword1' })
      .expect(401);
  });

  it('rejects unauthenticated access to a protected route', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('returns the current user profile with a valid access token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Passw0rd1' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(email);
  });
});
