import { Message } from 'node-nats-streaming';
import {
  Listener,
  OrderCancelledEvent,
  Subjects,
  OrderStatus,
} from '@charityx/common';
import { queueGroupName } from './queue-group-name.js';
import { Order } from '../../models/order.js';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // Process the order cancelled event
    const { id, version } = data;
    const order = await Order.findOne({ _id: id, version: version - 1 });
    if (!order) {
      throw new Error('Order not found');
    }
    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    // Acknowledge the message
    msg.ack();
  }
}
