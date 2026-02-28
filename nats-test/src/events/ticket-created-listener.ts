import { Message } from 'node-nats-streaming';
import { Listener } from './base-listener.js';
import { Subjects } from './subjects.js';
import { TicketCreatedEvent } from './ticket-created-event.js';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
  queueGroupName = 'payments-service';

  onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    console.log('Handling ticket created event:');

    console.log(` Ticket ID: ${data.id}`);
    console.log(` Ticket Title: ${data.title}`);
    console.log(` Ticket Price: ${String(data.price)}`);
    msg.ack();
  }
}
