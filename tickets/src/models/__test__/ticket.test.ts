/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Ticket } from '../ticket.js';

it('implements optimistic concurrency control', async () => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123',
  });

  // Save the ticket to the database
  await ticket.save();

  // Fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // Make two separate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  // Save the first fetched ticket
  await firstInstance!.save();

  // Save the second fetched ticket and expect an error
  await expect(secondInstance!.save()).rejects.toThrow();
});

it('increments the version number on multiple saves', async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123',
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);

  // Save the ticket again and expect the version number to increment
  // Mongoose requires the use of `set` to trigger the version increment
  ticket.set({ price: 10 });
  await ticket.save();
  expect(ticket.version).toEqual(1);

  ticket.set({ price: 15 });
  await ticket.save();
  expect(ticket.version).toEqual(2);
});
