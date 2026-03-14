import { Message } from 'node-nats-streaming';
import { Listener, OrderCreatedEvent, Subjects } from '@charityx/common';
import { queueGroupName } from './queue-group-name.js';
import { Ticket } from '../../models/ticket.js';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher.js';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // if no ticket, throw error
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // mark the ticket as being reserved by setting its orderId property
    // TODO: should version be updated here? or will the ticket updated listener handle that?
    ticket.set({ orderId: data.id });

    // save the ticket
    await ticket.save();

    console.log(`Ticket ${ticket.id} reserved for order ${data.id}`);

    // emit a ticket updated event
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
      version: ticket.version,
    });

    // ack the message
    msg.ack();
  }
}
