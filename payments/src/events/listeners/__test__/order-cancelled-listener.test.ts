import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { natsWrapper } from '../../../nats-wrapper.js';
import { OrderCancelledListener } from '../order-cancelled-listener.js';
import { OrderCancelledEvent, OrderStatus } from '@charityx/common';
import { Order } from '../../../models/order.js';

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId: 'sdfdf',
    price: 100,
    status: OrderStatus.Created,
  });
  await order.save();

  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: order.version + 1,
    ticket: {
      id: 'sdfdf',
    },
  };

  // @ts-expect-error - We only need to implement the ack function for this test
  const msg: Message = {
    ack: vi.fn(),
  };

  return { listener, data, msg, order };
};

it('updates the order status to cancelled', async () => {
  const { listener, data, msg, order } = await setup();

  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder).toBeDefined();
  expect(updatedOrder?.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
