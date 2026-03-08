import mongoose from 'mongoose';
import { app } from './app.js';
import { natsWrapper } from './nats-wrapper.js';
import { OrderCreatedListener } from './events/listeners/order-created-listener.js';
import { OrderCancelledListener } from './events/listeners/order-cancelled-listener.js';

const port = process.env.PORT ?? 3000;

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined');
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined');
  }

  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
  }

  try {
    // clusterId is 'ticketing' as defined in nats-depl.yaml, clientId can be any unique string, url is the address of the NATS server
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL,
    );
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed');
      process.exit();
    });

    // Gracefully close the NATS connection on process termination
    process.on('SIGINT', () => {
      natsWrapper.client.close();
    });
    process.on('SIGTERM', () => {
      natsWrapper.client.close();
    });

    // Listen for events
    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI); // db name: tickets
    console.log('Connected to MongoDB 🐲');
  } catch (error) {
    console.error('Error connecting to MongoDB: 🦄', error);
  }

  app.listen(port, () => {
    console.log(`🚗 Listening on http://localhost:${String(port)}!`);
  });
};

await start();
