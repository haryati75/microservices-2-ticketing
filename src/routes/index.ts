import { Router } from 'express';
import { sum } from '../sum.js';

const router = Router();

router.get('/', (req, res) => {
  const randNumber = () => Math.floor(Math.random() * 10) + 1;
  const a = randNumber();
  const b = randNumber();
  const result = sum(a, b);
  res.send(`Sum of random numbers ${String(a)} and ${String(b)} is ${String(result)}.`);
});

export default router;
