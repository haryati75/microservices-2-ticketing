import { Publisher, Subjects, TicketUpdatedEvent } from '@charityx/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
