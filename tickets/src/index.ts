import mongoose from 'mongoose';
import { app } from './app.js';

const port = process.env.PORT ?? 3000;

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }

  try {
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
