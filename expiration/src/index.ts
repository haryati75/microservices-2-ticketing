import { natsWrapper } from './nats-wrapper.js';

const start = async () => {
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
  } catch (err) {
    console.error(err);
  }
};

await start();
