/* eslint-disable vitest/expect-expect */
import request from 'supertest';
import { app } from '../../app.js';
import mongoose from 'mongoose';

it('returns a 404 if the provided id does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'New Concert',
      price: 100,
    })
    .expect(404);
});

it('returns 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'New Concert',
      price: 100,
    })
    .expect(401);
});

it('returns 401 if the user does not own the ticket', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'Concert',
      price: 20,
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${String(response.body.id)}`)
    .set('Cookie', global.signin()) // different user
    .send({
      title: 'New Concert',
      price: 100,
    })
    .expect(401);
});

it('returns 400 if the user provides an invalid title or price', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Concert',
      price: 20,
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${String(response.body.id)}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 100,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${String(response.body.id)}`)
    .set('Cookie', cookie)
    .send({
      title: 'Valid Title',
      price: -10,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${String(response.body.id)}`)
    .set('Cookie', cookie)
    .send({
      title: 'Valid Title',
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${String(response.body.id)}`)
    .set('Cookie', cookie)
    .send({
      price: 100,
    })
    .expect(400);
});

it('updates the ticket provided valid inputs', async () => {
  const cookie = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'Concert',
      price: 20,
    })
    .expect(201);

  const updatedTitle = 'New Concert';
  const updatedPrice = 100;

  const updateResponse = await request(app)
    .put(`/api/tickets/${String(response.body.id)}`)
    .set('Cookie', cookie)
    .send({
      title: updatedTitle,
      price: updatedPrice,
    })
    .expect(200);

  expect(updateResponse.body.title).toEqual(updatedTitle);
  expect(updateResponse.body.price).toEqual(updatedPrice);
});
