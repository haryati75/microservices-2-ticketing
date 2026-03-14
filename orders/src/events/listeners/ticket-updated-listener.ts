import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketUpdatedEvent } from '@charityx/common';
import { Ticket } from '../../models/ticket.js';
import { queueGroupName } from './queue-group-name.js';

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
  queueGroupName = queueGroupName; // ensures that only one instance of the service processes a given event

  async onMessage(
    data: TicketUpdatedEvent['data'],
    msg: Message,
  ): Promise<void> {
    const { id, title, price, version } = data;

    console.log('🪃 Received Ticket Updated Event in Orders service:', data);
    const ticket = await Ticket.findByEvent({ id, version });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.set({ title, price });
    await ticket.save();

    console.log('🪃 Ticket updated in Orders service:', ticket);

    msg.ack();
  }
}
