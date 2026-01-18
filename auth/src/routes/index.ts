import { Router } from 'express';
import currentUserRouter from './current-user.js';
import signinRouter from './signin.js';
import signupRouter from './signup.js';
import signoutRouter from './signout.js';
import allUsersRouter from './all-users.js';

const router = Router();

// Mount sub-routers
router.use('/', allUsersRouter);
router.use('/currentuser', currentUserRouter);
router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/signout', signoutRouter);

export default router;
