import { Publisher, OrderCancelledEvent, Subjects } from '@charityx/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
