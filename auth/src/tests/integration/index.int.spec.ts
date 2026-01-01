import request from 'supertest';
import { createTestApp } from '../helper/testApp.js';

describe('GET /api/users/currentuser', () => {
  it('should return sum of two random numbers', async () => {
    const app = createTestApp();
    const response = await request(app).get('/api/users/currentuser');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hi there!');
  });
});
