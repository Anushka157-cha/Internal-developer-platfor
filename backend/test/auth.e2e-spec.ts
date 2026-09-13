import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthController (e2e) - signup', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockAuthService = {
      signup: jest.fn().mockImplementation((dto) => Promise.resolve({ access_token: 'token', user: { id: 'u1', ...dto, role: 'DEVELOPER' } })),
    } as Partial<AuthService>;

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/signup (POST) returns token and user', async () => {
    const payload = { email: 'x@y.com', password: 'p', firstName: 'A', lastName: 'B' };
    const res = await request(app.getHttpServer()).post('/auth/signup').send(payload).expect(201);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.email).toBe('x@y.com');
  });
});
