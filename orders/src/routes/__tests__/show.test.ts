import request from 'supertest';
import { app } from '../../app.js';
import { buildTicket } from './build-ticket.js';

it('fetches the order', async () => {
  // Create a ticket
  const ticket = await buildTicket();

  const user = global.signin();

  // Make a request to build an order with the ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // Make request to fetch the order
  const response = await request(app)
    .get(`/api/orders/${String(order.id)}`)
    .set('Cookie', user)
    .expect(200);

  expect(response.body.id).toEqual(order.id);
  expect(response.body.ticket.id).toEqual(ticket.id);
});

it('returns an error if one user tries to fetch another users order', async () => {
  // Create a ticket
  const ticket = await buildTicket();

  const userOne = global.signin();
  const userTwo = global.signin();

  // Make a request to build an order with the ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', userOne)
    .send({ ticketId: ticket.id })
    .expect(201);

  // Make request to fetch the order as User #2
  const response = await request(app)
    .get(`/api/orders/${String(order.id)}`)
    .set('Cookie', userTwo)
    .expect(401);

  expect(response.body.errors[0].message).toContain('Not authorized');
});
