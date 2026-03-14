import { Listener, OrderCreatedEvent, Subjects } from '@charityx/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name.js';
import { expirationQueue } from '../../queues/expiration-queue.js';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    const delay = new Date(data.expiresAt).getTime() - new Date().getTime();

    // TODO: not working
    void expirationQueue.add(
      {
        orderId: data.id,
      },
      {
        delay,
      },
    );
    msg.ack();
  }
}
