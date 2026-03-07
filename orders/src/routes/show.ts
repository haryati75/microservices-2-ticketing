import express, { Request, Response } from 'express';
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from '@charityx/common';
import { Order } from '../models/order.js';

const router = express.Router();

router.get(
  '/api/orders/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate('ticket'); // associate the order with the ticket
    if (!order) {
      throw new NotFoundError();
    }
    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    res.send(order);
  },
);

export { router as showOrderRouter };
