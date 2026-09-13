import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockAuth = { login: jest.fn().mockResolvedValue({ access_token: 't' }) } as Partial<AuthService>;

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [ThrottlerModule.forRoot({ ttl: 60, limit: 10 })],
      providers: [{ provide: AuthService, useValue: mockAuth }, { provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login should return 429 after exceeding route-specific limit (5)', async () => {
    const agent = request(app.getHttpServer());
    const payload = { email: 'a@b.com', password: 'p' };

    // make 5 successful attempts
    for (let i = 0; i < 5; i++) {
      await agent.post('/auth/login').send(payload).expect(201);
    }

    // 6th attempt should be rate limited
    await agent.post('/auth/login').send(payload).expect(429);
  });
});
