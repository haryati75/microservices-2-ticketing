import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/user.js';
import { RequestValidationError } from '../errors/request-validation-error.js';
import { BadRequestError } from '../errors/bad-request-error.js';

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

  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const { email, password } = req.body;

    // Check if the user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email in use 🦄');
    }

    // Create and save the new user
    const user = User.build({ email, password });
    await user.save();

    res.status(201).send({ message: '🎉 User created', user });
  },
);

export default router;
