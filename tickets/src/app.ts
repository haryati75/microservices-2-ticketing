import express from 'express';
import cookieSession from 'cookie-session';

import { errorHandler, NotFoundError, currentUser } from '@charityx/common';
import { createTicketRouter } from './routes/new.js';
import { showTicketRouter } from './routes/show.js';
import { indexTicketRouter } from './routes/index.js';
import { updateTicketRouter } from './routes/update.js';

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
app.use(createTicketRouter);
app.use(showTicketRouter);
app.use(indexTicketRouter);
app.use(updateTicketRouter);

// Catch-all middleware for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError());
});
app.use(errorHandler);

export { app };
