import express from 'express';
import passport from 'passport';
import '../../helpers/passport/google';
import '../../helpers/passport/facebook';
import { respondCallback } from '../../helpers/passport/callback';
import responseGenerator from '../../helpers/responseGenerator';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['email', 'profile']
  })
);

router.get(
  '/google/redirect',
  passport.authenticate('google', { session: false }),
  respondCallback
);

router.get('/fail', (req, res) => {
  return responseGenerator.sendError(res, 400, 'Authentication fail');
});

router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false }),
  respondCallback
);

router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: 'email'
  })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  respondCallback
);

export default router;
