import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '@charityx/common';
import { requireAuth } from '@charityx/common';
import { Ticket } from '../models/ticket.js';

const router = express.Router();

router.post(
  '/api/tickets',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { title, price } = req.body;
    const ticket = Ticket.build({
      title,
      price,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId: req.currentUser!.id, // currentUser is guaranteed to be defined by requireAuth
    });
    await ticket.save();
    res.status(201).send(ticket);
  },
);

export { router as createTicketRouter };
