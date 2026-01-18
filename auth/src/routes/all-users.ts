import express from 'express';

import { currentUser } from '../middlewares/current-user.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { User } from '../models/user.js';

const router = express.Router();

router.get('/', currentUser, requireAuth, async (req, res) => {
  // Assuming User is a model that can fetch users from the database
  const users = await User.find({}, 'id email'); // Fetch only id and email fields
  res.send({ users });
});

export default router;
