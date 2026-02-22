import nats, { Message } from 'node-nats-streaming';
import { randomBytes } from 'crypto';

const stan = nats.connect('ticketing', randomBytes(4).toString('hex'), {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Listener connected to NATS');

  stan.on('close', () => {
    console.log('NATS connection closed');
    process.exit();
  });

  // Set up subscription options for the listener
  // options are tightly coupled to the behavior of the listener and how it processes messages, so they are important to understand and configure correctly
  const options = stan
    .subscriptionOptions()
    .setManualAckMode(true) // enables manual acknowledgment of messages, which is important for ensuring that messages are not lost if the listener crashes while processing a message
    .setDeliverAllAvailable() // ensures that the listener receives all past messages when it first connects
    .setDurableName('accounting-service'); // durable subscription allows the listener to receive messages that were published while it was offline

  const subscription = stan.subscribe(
    'ticket:created',
    'queue-group-name', // queue group ensures that if there are multiple instances of the listener, only one will receive each message
    options,
  );

  subscription.on('message', (msg: Message) => {
    const data = msg.getData();
    if (typeof data === 'string') {
      console.log(
        `Received event #${String(msg.getSequence())}, with data: ${data}`,
      );
    }
    msg.ack();
  });
});

// Gracefully close the NATS connection on process termination
process.on('SIGINT', () => {
  stan.close();
});
process.on('SIGTERM', () => {
  stan.close();
});
