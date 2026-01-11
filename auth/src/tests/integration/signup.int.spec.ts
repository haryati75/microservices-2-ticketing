import request from 'supertest';
import { createTestApp } from '../helper/testApp.js';

interface ValidationError {
  msg: string;
  path?: string;
  value?: unknown;
}

interface SignupResponse {
  message?: string;
  errors?: ValidationError[];
}

// TODO: refactor to use beforeEach to create app instance
describe.todo('POST /api/users/signup', () => {
  it('should return 201 on successful signup with valid email and password', async () => {
    const app = createTestApp();
    const response = await request(app).post('/api/users/signup').send({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User created');
  });

  it('should return 400 with invalid email', async () => {
    const app = createTestApp();
    const response = await request(app).post('/api/users/signup').send({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    const body = response.body as SignupResponse;
    expect(body.errors?.[0].msg).toBe('Email must be valid');
  });

  it('should return 400 with password less than 4 characters', async () => {
    const app = createTestApp();
    const response = await request(app).post('/api/users/signup').send({
      email: 'test@test.com',
      password: 'abc',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    const body = response.body as SignupResponse;
    expect(body.errors?.[0].msg).toBe(
      'Password must be between 4 and 20 characters',
    );
  });

  it('should return 400 with password more than 20 characters', async () => {
    const app = createTestApp();
    const response = await request(app)
      .post('/api/users/signup')
      .send({
        email: 'test@test.com',
        password: 'a'.repeat(21),
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    const body = response.body as SignupResponse;
    expect(body.errors?.[0].msg).toBe(
      'Password must be between 4 and 20 characters',
    );
  });

  it('should return 400 when email is missing', async () => {
    const app = createTestApp();
    const response = await request(app).post('/api/users/signup').send({
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    const body = response.body as SignupResponse;

    const emailError = body.errors?.find(
      (err: ValidationError) => err.path === 'email' && err.value === undefined,
    );
    expect(emailError?.msg).toBe('Invalid value');
  });

  it('should return 400 when password is missing', async () => {
    const app = createTestApp();
    const response = await request(app).post('/api/users/signup').send({
      email: 'test@test.com',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    const body = response.body as SignupResponse;

    const passwordError = body.errors?.find(
      (err: ValidationError) =>
        err.path === 'password' && err.value === undefined,
    );
    expect(passwordError?.msg).toBe('Invalid value');
  });

  it('should return 400 when both email and password are missing', async () => {
    const app = createTestApp();
    const response = await request(app).post('/api/users/signup').send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    const body = response.body as SignupResponse;
    expect(body.errors).toHaveLength(4); // Two errors for email, two for password

    const emailError = body.errors?.find(
      (err: ValidationError) => err.path === 'email' && err.value === undefined,
    );
    const passwordError = body.errors?.find(
      (err: ValidationError) =>
        err.path === 'password' && err.value === undefined,
    );

    expect(emailError?.msg).toBe('Invalid value');
    expect(passwordError?.msg).toBe('Invalid value');
  });
});
