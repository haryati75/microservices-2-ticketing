import { Router } from 'express';

const router = Router();

router.get('/api/users/currentuser', (req, res) => {
  console.log('API hit!');
  res.send('Hi there!');
});

export default router;
