import express, { Request, Response } from 'express';
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from '@charityx/common';
import { Order, OrderStatus } from '../models/order.js';

const router = express.Router();

router.delete(
  '/api/orders/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }

    // Check if the order belongs to the user
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    order.status = OrderStatus.Cancelled;
    await order.save();

    // TODO: Publish an event saying that an order was cancelled

    res.status(204).send(order);
  },
);

export { router as deleteOrderRouter };
