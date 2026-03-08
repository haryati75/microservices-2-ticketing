import mongoose from 'mongoose';
import { OrderCancelledEvent } from '@charityx/common';
import { Ticket } from '../../../models/ticket.js';
import { natsWrapper } from '../../../nats-wrapper.js';
import { OrderCancelledListener } from '../order-cancelled-listener.js';

const setup = async () => {
  // create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
  });
  ticket.set({ orderId });
  await ticket.save();

  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // create a fake message object
  // @ts-expect-error -- we only need to implement the ack function for this test
  const msg: Message = {
    ack: vi.fn(),
  };

  return { listener, data, msg, ticket, orderId };
};

it('updates the ticket, publishes an event and acks the message', async () => {
  const { listener, data, msg, ticket } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket?.orderId).toBeUndefined();
  expect(msg.ack).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
