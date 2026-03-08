import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketCreatedListener } from '../ticket-created-listener.js';
import { TicketCreatedEvent } from '@charityx/common';
import { natsWrapper } from '../../../nats-wrapper.js';
import { Ticket } from '../../../models/ticket.js';

const setup = () => {
  // create an instance of the listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // create a fake data event
  const data: TicketCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    title: 'concert',
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // create a fake message object
  // @ts-expect-error - we only need to implement the ack function for our tests
  const msg: Message = {
    ack: vi.fn(),
  };

  // return all of this stuff
  return { listener, data, msg };
};

it('creates and saves a ticket', async () => {
  const { listener, data, msg } = setup();

  // call the onMessage function with the data and message objects
  await listener.onMessage(data, msg);

  // write assertions to make sure a ticket was created
  const ticket = await Ticket.findById(data.id);
  expect(ticket).toBeDefined();
  expect(ticket?.title).toEqual(data.title);
  expect(ticket?.price).toEqual(data.price);
});

it('acks the message', async () => {
  const { listener, data, msg } = setup();

  // call the onMessage function with the data and message objects
  await listener.onMessage(data, msg);

  // write assertions to make sure the message was acked
  expect(msg.ack).toHaveBeenCalled();
});
