import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { User } from '../models/user.js';
import { validateRequest } from '../middlewares/validate-request.js';
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
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Check if the user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email in use 🦄');
    }

    // Create and save the new user
    const user = User.build({ email, password });
    await user.save();

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      process.env.JWT_KEY!, // checked on startup
    );
    // Store it on session object
    req.session = {
      jwt: userJwt,
    };

    res.status(201).send({ message: '🎉 User created', user });
  },
);

export default router;
