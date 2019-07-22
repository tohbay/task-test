import Joi from 'joi';

const username = Joi.string()
  .lowercase()
  .required();

const email = Joi.string()
  .email()
  .lowercase()
  .required();

const password = Joi.string()
  .min(8)
  .required()
  .strict();

const token = Joi.string().required();

const followeeId = Joi.number()
  .integer()
  .required();

const articleId = Joi.number()
  .integer()
  .required();

const bookmarkArticle = {
  body: {
    articleId
  }
};

const followOrUnfollow = {
  body: {
    followeeId
  }
};

const createAccountSchema = {
  body: {
    username,
    email,
    password
  }
};

const loginSchema = {
  body: {
    email,
    password
  }
};

const verifyTokenSchema = {
  params: {
    token
  }
};

const updateProfileSchema = {
  body: {
    avatar: Joi.string()
      .regex(/(\.jpg|\.jpeg|\.png|\.gif)$/i)
      .trim()
      .error(new Error('Avatar should be an Image')),
    bio: Joi.string().trim()
  }
};

const ratingSchema = {
  params: {
    articleId: Joi.number()
      .min(1)
      .required()
  },
  body: {
    ratings: Joi.number()
      .min(1)
      .max(5)
      .required()
      .error(new Error('ratings must be a number between 1 and 5'))
  }
};

export default {
  '/signup': createAccountSchema,
  '/login': loginSchema,
  '/verify/:token': verifyTokenSchema,
  '/follow': followOrUnfollow,
  '/unfollow': followOrUnfollow,
  '/user/:id': updateProfileSchema,
  '/bookmark': bookmarkArticle,
  '/unbookmark': bookmarkArticle,
  '/:articleId/ratings': ratingSchema
};
