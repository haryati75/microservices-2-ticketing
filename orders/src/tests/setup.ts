import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
  var signin: () => string[];
}

vi.mock('../nats-wrapper.js'); // Mock the NATS wrapper to prevent actual NATS connections during tests

let mongo: MongoMemoryServer;
beforeAll(async () => {
  process.env.JWT_KEY = 'test_jwt_key';
  process.env.NODE_ENV = 'test';

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  vi.clearAllMocks();
  const collections = await mongoose.connection.db?.collections();

  if (collections) {
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

// Tickets tests build a JWT locally to avoid calling the auth service.
global.signin = () => {
  // Build a JWT payload.  { id, email }
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };

  // Create the JWT!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return [`session=${base64}`];
};
