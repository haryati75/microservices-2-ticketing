import mongoose from 'mongoose';
import { OrderStatus } from '@charityx/common';

interface OrderAttrs {
  id: string;
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

interface OrderDoc extends mongoose.Document {
  id: string;
  version: number;
  userId: string;
  status: OrderStatus;
  price: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Created,
    },
  },
  {
    optimisticConcurrency: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, ...rest } = ret;
        return rest;
      },
    },
  },
);

orderSchema.set('versionKey', 'version');

orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order({
    _id: attrs.id,
    version: attrs.version,
    userId: attrs.userId,
    price: attrs.price,
    status: attrs.status,
  });
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
