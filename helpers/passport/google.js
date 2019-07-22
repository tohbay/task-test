import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { callback, respondCallback } from './callback';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/auth/google/redirect',
      clientID: process.env.google_clientID,
      clientSecret: process.env.google_clientSecret
    },
    callback,
    respondCallback
  )
);
