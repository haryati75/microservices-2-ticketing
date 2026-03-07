import express, { Request, Response } from 'express';
import { requireAuth } from '@charityx/common';
import { Order } from '../models/order.js';

const router = express.Router();

router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const orders = await Order.find({ userId: req.currentUser!.id }).populate(
    'ticket',
  );
  res.send(orders);
});

export { router as indexOrderRouter };
