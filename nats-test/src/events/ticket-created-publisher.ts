import { Publisher } from './base-publisher.js';
import { Subjects } from './subjects.js';
import { TicketCreatedEvent } from './ticket-created-event.js';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
