import express from 'express';
import mongoose from 'mongoose';
import cookieSession from 'cookie-session';

import router from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { NotFoundError } from './errors/not-found-error.js';

const port = process.env.PORT ?? 3000;

const app = express();
app.set('trust proxy', true); // trust first proxy
app.use(express.json());
app.use(
  cookieSession({
    signed: false,
    secure: true,
  }),
);

// Routes
app.use('/api/users', router);

// Catch-all middleware for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError());
});
app.use(errorHandler);

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
