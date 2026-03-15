import { Message } from 'node-nats-streaming';
import { Listener, OrderCreatedEvent, Subjects } from '@charityx/common';
import { queueGroupName } from './queue-group-name.js';
import { Order } from '../../models/order.js';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // Process the order created event
    const {
      id,
      version,
      userId,
      ticket: { price },
      status,
    } = data;
    const order = Order.build({
      id,
      version,
      userId,
      price,
      status,
    });
    await order.save();

    // Acknowledge the message
    msg.ack();
  }
}
