import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import dotenv from 'dotenv';
import { callback, respondCallback } from './callback';

dotenv.config();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.fbk_id,
      clientSecret: process.env.fbk_secret,
      callbackURL: 'http://localhost:3000/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'emails', 'name'],
      enableProof: false
    },
    callback,
    respondCallback
  )
);
