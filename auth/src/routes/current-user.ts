import express from 'express';

import { currentUser } from '../middlewares/current-user.js';

const router = express.Router();

router.get('/', currentUser, (req, res) => {
  res.send({ currentUser: req.currentUser ?? null });
});

export default router;
