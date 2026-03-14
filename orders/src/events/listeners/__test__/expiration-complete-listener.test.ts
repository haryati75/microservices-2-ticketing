import { ExpirationCompleteListener } from '../expiration-complete-listener.js';
import { OrderStatus, ExpirationCompleteEvent } from '@charityx/common';
import { natsWrapper } from '../../../nats-wrapper.js';
import { Order } from '../../../models/order.js';
import { Ticket } from '../../../models/ticket.js';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { type Mock } from 'vitest';

const setup = async () => {
  // create an instance of the listener
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  // create and save an order
  const order = Order.build({
    status: OrderStatus.Created,
    userId: 'asdf',
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  // create a fake data object
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  };

  // create a fake message object
  // @ts-expect-error - we only need the ack function for this test
  const msg: Message = {
    ack: vi.fn(),
  };

  return { listener, data, msg, order, ticket };
};

it('updates the order status to cancelled', async () => {
  const { listener, data, msg, order } = await setup();

  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder?.status).toEqual(OrderStatus.Cancelled);
});

it('emits an OrderCancelled event', async () => {
  const { listener, data, msg, order } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const eventData = JSON.parse(
    (natsWrapper.client.publish as Mock).mock.calls[0][1],
  );

  expect(eventData.id).toEqual(order.id);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
