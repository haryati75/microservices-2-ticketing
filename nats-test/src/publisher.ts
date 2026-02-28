import nats from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher.js';

const stan = nats.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Publisher connected to NATS');

  const publisher = new TicketCreatedPublisher(stan);

  // Run async work without making the event handler itself async
  void (async () => {
    try {
      await publisher.publish({
        id: '123',
        title: 'concert',
        price: 20,
      });
    } catch (err) {
      console.error('Error publishing event', err);
    }
  })();
});
