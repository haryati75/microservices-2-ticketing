import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketUpdatedListener } from '../ticket-updated-listener.js';
import { TicketUpdatedEvent } from '@charityx/common';
import { natsWrapper } from '../../../nats-wrapper.js';
import { Ticket } from '../../../models/ticket.js';

const setup = async () => {
  // create an instance of the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  // create a fake data event
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'new concert',
    price: 999,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // create a fake message object
  // @ts-expect-error - we only need to implement the ack function for our tests
  const msg: Message = {
    ack: vi.fn(),
  };

  // return all of this stuff
  return { listener, ticket, data, msg };
};

it('finds, updates, and saves a ticket', async () => {
  const { listener, ticket, data, msg } = await setup();

  // call the onMessage function with the data and message objects
  await listener.onMessage(data, msg);

  // write assertions to make sure a ticket was updated
  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket?.title).toEqual(data.title);
  expect(updatedTicket?.price).toEqual(data.price);
  expect(updatedTicket?.version).toEqual(data.version);
});

it('updates reservation state via orderId and increments version', async () => {
  const { listener, ticket, data, msg } = await setup();

  data.orderId = new mongoose.Types.ObjectId().toHexString();
  await listener.onMessage(data, msg);

  const reservedTicket = await Ticket.findById(ticket.id);
  expect(reservedTicket?.orderId).toEqual(data.orderId);
  expect(reservedTicket?.version).toEqual(data.version);

  const unreserveData: TicketUpdatedEvent['data'] = {
    ...data,
    version: data.version + 1,
    orderId: undefined,
  };

  await listener.onMessage(unreserveData, msg);

  const unreservedTicket = await Ticket.findById(ticket.id);
  expect(unreservedTicket?.orderId).toBeUndefined();
  expect(unreservedTicket?.version).toEqual(unreserveData.version);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // call the onMessage function with the data and message objects
  await listener.onMessage(data, msg);

  // write assertions to make sure the message was acked
  expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async () => {
  const { listener, data, msg } = await setup();

  data.version = 10;

  try {
    await listener.onMessage(data, msg);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return;
  }

  expect(msg.ack).not.toHaveBeenCalled();
});
