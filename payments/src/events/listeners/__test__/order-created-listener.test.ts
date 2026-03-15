import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { natsWrapper } from '../../../nats-wrapper.js';
import { OrderCreatedListener } from '../order-created-listener.js';
import { OrderCreatedEvent, OrderStatus } from '@charityx/common';
import { Order } from '../../../models/order.js';

const setup = () => {
  const listener = new OrderCreatedListener(natsWrapper.client);

  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: 'sdfdf',
    userId: 'sdfdf',
    ticket: {
      id: 'sdfdf',
      price: 100,
    },
    status: OrderStatus.Created,
  };

  // @ts-expect-error - We only need to implement the ack function for this test
  const msg: Message = {
    ack: vi.fn(),
  };

  return { listener, data, msg };
};

it('replicates the order info', async () => {
  const { listener, data, msg } = setup();

  await listener.onMessage(data, msg);

  const order = await Order.findById(data.id);

  expect(order).toBeDefined();
  expect(order?.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
  const { listener, data, msg } = setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
