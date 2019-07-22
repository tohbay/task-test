import passport from 'passport';
import dotenv from 'dotenv';
import GitHubStrategy from 'passport-github2';
import { callback, respondCallback } from './callback';

dotenv.config();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.github_clientID,
      clientSecret: process.env.github_clientSecret,
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: 'user:email'
    },
    callback,
    respondCallback
  )
);
