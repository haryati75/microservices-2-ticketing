import { Publisher, Subjects, TicketCreatedEvent } from '@charityx/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
