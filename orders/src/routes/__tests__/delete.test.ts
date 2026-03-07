import request from 'supertest';
import { app } from '../../app.js';
import { Ticket } from '../../models/ticket.js';
import { Order, OrderStatus } from '../../models/order.js';

const buildTicket = async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
  });
  await ticket.save();
  return ticket;
};

it('marks an order as cancelled', async () => {
  // Create a ticket with Ticket Model
  const ticket = await buildTicket();

  const user = global.signin();

  // Make a request to build an order with the ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // Make request to cancel the order
  await request(app)
    .delete(`/api/orders/${String(order.id)}`)
    .set('Cookie', user)
    .expect(204);

  // Expect the order status to be cancelled
  const updatedOrder = await Order.findById(order.id);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it.todo('emits an order cancelled event');
