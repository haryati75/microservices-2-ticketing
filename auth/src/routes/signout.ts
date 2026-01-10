import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  res.send({ message: 'Signout route' });
});

export default router;
