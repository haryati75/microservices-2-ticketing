import express from 'express';
import router from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { NotFoundError } from './errors/not-found-error.js';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api/users', router);

// Catch-all middleware for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError());
});
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${String(port)}!`);
});
