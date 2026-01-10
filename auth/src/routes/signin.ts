import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  res.send({ message: 'Signin route' });
});

export default router;
