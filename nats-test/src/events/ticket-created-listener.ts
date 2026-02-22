import { Message } from 'node-nats-streaming';
import { Listener } from './base-listener.js';

export class TicketCreatedListener extends Listener {
  subject = 'ticket:created';
  queueGroupName = 'payments-service';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage(data: any, msg: Message) {
    console.log(`Handling ticket created event: ${JSON.stringify(data)}`);
    msg.ack();
  }
}
