import responseGenerator from '../responseGenerator';
import helpers from '../utils';
import Baserepository from '../../repository/base.repository';
import db from '../../database/models';

export const callback = async (accessToken, refreshToken, payload, done) => {
  const { displayName, emails, photos, id: password } = payload;
  const userEmail = emails[0].value;
  try {
    const confirmUser = await Baserepository.findOrCreate(
      db.User,
      { email: userEmail },
      {
        username: displayName,
        avatar: photos[0].value,
        role: 'user',
        email: userEmail,
        password
      }
    );
    const [user, created] = confirmUser;
    const theUser = await user.get({ plain: true });
    const { id, username, email, role, status } = theUser;
    const data = { id, username, email, role, status };
    const token = helpers.jwtSigner({ ...data });

    const info = {
      id,
      username,
      email,
      role,
      status,
      token,
      created
    };

    return done(null, info);
  } catch (err) {
    throw new Error(err);
  }
};

export const respondCallback = (req, res) => {
  if (req.user.created) {
    responseGenerator.sendSuccess(
      res,
      201,
      req.user,
      'Account created successfully. Welcome to errorSwag.'
    );
  }
  responseGenerator.sendSuccess(res, 200, req.user);
};

export default callback;
