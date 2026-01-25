import express from 'express';

import { currentUser } from '@charityx/common';

const router = express.Router();

router.get('/', currentUser, (req, res) => {
  res.send({ currentUser: req.currentUser ?? null });
});

export default router;
