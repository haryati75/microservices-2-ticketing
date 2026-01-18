import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { Password } from '../services/password.js';
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
      .notEmpty()
      .withMessage('🐣 You must supply a password'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find the user by email
    // include password field explicitly since select: false in schema
    const existingUser = await User.findOne({ email: { $eq: email } }).select(
      '+password',
    );
    if (!existingUser) {
      throw new BadRequestError('🥾 Invalid credentials');
    }

    // Check if the password matches
    const passwordsMatch = await Password.compare(
      existingUser.password,
      password,
    );
    if (!passwordsMatch) {
      throw new BadRequestError('🥾 Invalid credentials');
    }

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      process.env.JWT_KEY!, // checked on startup
    );
    // Store it on session object
    req.session = {
      jwt: userJwt,
    };

    res.status(200).send({ message: '🌈 Signed in', user: existingUser });
  },
);

export default router;
