import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post(
  '/',
  body('email').notEmpty().isEmail().withMessage('🦤Email must be valid!'),
  body('password')
    .notEmpty()
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('🐣 Password must be between 4 and 20 characters'),
  (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log('🐓 Validation errors!');
      return res.status(400).send({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // TODO: Add logic to check if user already exists

    console.log(`🐦 Creating user with email: ${String(email)} and password: ${String(password)}`);

    // TODO: new User({ email, password }).save();
    // TODO: Add logic to check db save errors
    res.status(201).send({ message: 'User created 🦉' });
  },
);

export default router;
