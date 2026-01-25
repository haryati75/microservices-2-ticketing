import express from 'express';

import { currentUser, requireAuth } from '@charityx/common';
import { User } from '../models/user.js';

const router = express.Router();

router.get('/', currentUser, requireAuth, async (req, res) => {
  const users = await User.find({}, 'id email'); // Fetch only id and email fields
  res.send({ users });
});

export default router;
