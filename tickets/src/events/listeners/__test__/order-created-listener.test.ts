import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { type Mock } from 'vitest';
import { OrderCreatedEvent, OrderStatus } from '@charityx/common';
import { OrderCreatedListener } from '../order-created-listener.js';
import { natsWrapper } from '../../../nats-wrapper.js';
import { Ticket } from '../../../models/ticket.js';

const setup = async () => {
  // create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 99,
    userId: 'test-user',
  });
  await ticket.save();

  // create the fake data event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'test-user',
    expiresAt: 'fake-date',
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // create a fake message object
  // @ts-expect-error -- we only need to implement the ack function for this test
  const msg: Message = {
    ack: vi.fn(),
  };

  return { listener, data, msg, ticket };
};

it('sets the orderId of the ticket', async () => {
  const { listener, data, msg, ticket } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).toBeDefined();
  expect(updatedTicket?.orderId).toEqual(data.id);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as Mock).mock.calls[0][1],
  );

  expect(ticketUpdatedData.orderId).toEqual(data.id);
});
