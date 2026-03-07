import { Publisher, OrderCreatedEvent, Subjects } from '@charityx/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
