import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  req.session = undefined;
  res.send({});
});

export default router;
