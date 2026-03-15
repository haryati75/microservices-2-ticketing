import nats, { Stan } from 'node-nats-streaming';

// This is a wrapper around the NATS client to manage the connection and provide a singleton instance of the client throughout the app
class NatsWrapper {
  private _client?: Stan;

  get client() {
    if (!this._client) {
      throw new Error('💥 Cannot access NATS client before connecting');
    }

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise<void>((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to NATS 🦄');
        resolve();
      });

      this.client.on('error', (err) => {
        reject(new Error(`💥 NATS connection error: ${JSON.stringify(err)}`));
      });
    });
  }
}

export const natsWrapper = new NatsWrapper();
