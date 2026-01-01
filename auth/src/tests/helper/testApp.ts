import express from 'express';
import router from '../../routes/index.js';

export const createTestApp = () => {
  const app = express();
  app.use(router);
  return app;
};
