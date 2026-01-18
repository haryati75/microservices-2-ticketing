import mongoose from 'mongoose';
import { app } from './app.js';

const port = process.env.PORT ?? 3000;

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  }

  try {
    await mongoose.connect('mongodb://auth-mongo-srv:27017/auth'); // db name: auth
    console.log('Connected to MongoDB 🐲');
  } catch (error) {
    console.error('Error connecting to MongoDB: 🦄', error);
  }

  app.listen(port, () => {
    console.log(`🚗 Listening on http://localhost:${String(port)}!`);
  });
};

await start();
