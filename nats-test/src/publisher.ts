import nats from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher.js';

const stan = nats.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Publisher connected to NATS');

  // Publish an event to the 'ticket:created' subject
  const publisher = new TicketCreatedPublisher(stan);
  publisher.publish({
    id: '123',
    title: 'concert',
    price: 20,
  });
});
