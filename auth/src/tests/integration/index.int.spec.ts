import request from 'supertest';
import { createTestApp } from '../helper/testApp.js';

describe('GET /', () => {
  it('should return sum of two random numbers', async () => {
    const app = createTestApp();
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toMatch(/Sum of random numbers \d+ and \d+ is \d+\./);
  });
});
