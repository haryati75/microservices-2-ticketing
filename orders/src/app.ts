import express from 'express';
import cookieSession from 'cookie-session';

import { errorHandler, NotFoundError, currentUser } from '@charityx/common';
import { createOrderRouter } from './routes/new.js';
import { showOrderRouter } from './routes/show.js';
import { indexOrderRouter } from './routes/index.js';
import { deleteOrderRouter } from './routes/delete.js';

const app = express();
app.set('trust proxy', true); // trust first proxy
app.use(express.json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  }),
);
app.use(currentUser);

// Routes
app.use(createOrderRouter);
app.use(showOrderRouter);
app.use(indexOrderRouter);
app.use(deleteOrderRouter);

// Catch-all middleware for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError());
});
app.use(errorHandler);

export { app };
