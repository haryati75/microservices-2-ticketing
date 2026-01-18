import request from 'supertest';
import { app } from '../../app.js';

it('clears the cookie after signing out', async () => {
  // First, sign up a user to set the cookie
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  // Now, sign out the user
  const response = await request(app)
    .post('/api/users/signout')
    .send()
    .expect(200);

  const cookies = response.get('Set-Cookie');
  expect(cookies).toBeDefined();
  expect(cookies?.[0]).toMatch(/session=;/);
});
