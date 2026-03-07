import mongoose from 'mongoose';
import { Order, OrderStatus } from './order.js';

interface TicketAttrs {
  title: string;
  price: number;
}

export interface TicketDoc extends mongoose.Document {
  id: string;
  title: string;
  price: number;
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, __v, ...rest } = ret;
        return rest;
      },
    },
  },
);

ticketSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket(attrs);
};

ticketSchema.methods.isReserved = async function () {
  // Run query to look at all orders. Find an order where the ticket
  // is the ticket we just found *and* the order status is *not* cancelled.
  // If we find an order from that means the ticket *is* reserved
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder; // means if existingOrder is null or undefined, return false. Otherwise, return true
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
