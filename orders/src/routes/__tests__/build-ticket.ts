import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket.js';

export const buildTicket = async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();
  return ticket;
};
