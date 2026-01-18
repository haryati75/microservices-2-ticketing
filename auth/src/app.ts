import express from 'express';
import cookieSession from 'cookie-session';

import router from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { NotFoundError } from './errors/not-found-error.js';

const app = express();
app.set('trust proxy', true); // trust first proxy
app.use(express.json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  }),
);

// Routes
app.use('/api/users', router);

// Catch-all middleware for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError());
});
app.use(errorHandler);

export { app };
