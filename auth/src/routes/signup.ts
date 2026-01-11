import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestValidationError } from '../errors/request-validation-error.js';
import { DatabaseConnectionError } from '../errors/database-connection-error.js';

const router = express.Router();

router.post(
  '/',
  [
    body('email').isEmail().withMessage('🦤 Email must be valid!'),
    body('password')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('🐣 Password must be between 4 and 20 characters'),
  ],
  // eslint-disable-next-line @typescript-eslint/require-await
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const { email, password } = req.body;

    // TODO: Add logic to check if user already exists

    console.log(
      `🐦 Creating user with email: ${String(email)} and password: ${String(password)}`,
    );

    throw new DatabaseConnectionError();

    // TODO: new User({ email, password }).save();
    // TODO: Add logic to check db save errors
    res.status(201).send({ message: 'User created 🦉' });
  },
);

export default router;
