import express from 'express';
import router from '../../routes/index.js';

export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', router);
  return app;
};
