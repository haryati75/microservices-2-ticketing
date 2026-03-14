import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketCreatedEvent } from '@charityx/common';
import { Ticket } from '../../models/ticket.js';
import { queueGroupName } from './queue-group-name.js';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
  queueGroupName = queueGroupName; // ensures that only one instance of the service processes a given event

  async onMessage(
    data: TicketCreatedEvent['data'],
    msg: Message,
  ): Promise<void> {
    const { id, title, price } = data;

    const ticket = Ticket.build({
      id,
      title,
      price,
    });
    await ticket.save();

    // check if the ticket was created successfully via a query to the database
    const existingTicket = await Ticket.findById(ticket.id);
    if (!existingTicket) {
      throw new Error('Ticket creation failed');
    }

    console.log('🪃 Ticket created in Orders service:', ticket);

    msg.ack();
  }
}
