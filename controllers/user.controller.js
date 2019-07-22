import BaseRepository from '../repository/base.repository';
import responseGenerator from '../helpers/responseGenerator';
import utility from '../helpers/utils';
import db from '../database/models';
import Pagination from '../helpers/pagination';
import mailer from '../helpers/mailer';

const { jwtSigner, verifyPassword } = utility;

/**
 * @class UserController
 */
class UserController {
  /**
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- return user's account information
   * @memberof UserController
   */
  static async createAccount(req, res) {
    try {
      const { username, email, password } = req.body;

      const user = await BaseRepository.findOneByField(db.User, { email });

      if (user) {
        if (user.status === 'unverified') {
          return responseGenerator.sendError(
            res,
            400,
            `This account is already registered. A verification link has been sent to your email. Check your email to continue.`
          );
        }

        return responseGenerator.sendError(
          res,
          400,
          'User with this email address already exist'
        );
      }

      const createdUser = await BaseRepository.create(db.User, {
        username,
        email,
        password
      });

      const { id, role, status } = createdUser;

      const token = jwtSigner({
        id,
        username,
        email,
        role
      });

      const { protocol } = req;
      mailer({
        name: username,
        receiver: email,
        subject: 'Welcome to ErrorSwag',
        templateName: 'confirm_account',
        confirm_account_url: `${protocol}://${req.get(
          'host'
        )}/api/v1/auth/verify/${token}`
      });

      return responseGenerator.sendSuccess(
        res,
        201,
        {
          username,
          email,
          role,
          status,
          token
        },
        'Account created successfully. An email verification link has been sent to your email address.'
      );
    } catch (error) {
      return responseGenerator.sendError(res, 500, error);
    }
  }

  /**
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- return user's account information
   * @memberof UserController
   */
  static async loginUser(req, res) {
    const { email, password } = req.body;
    try {
      const user = await BaseRepository.findOneByField(db.User, { email });

      if (user) {
        const bcryptResponse = await verifyPassword(password, user.password);
        if (bcryptResponse) {
          const { id, username, email, role, status } = user;
          const token = jwtSigner({
            id,
            username,
            email,
            role
          });

          if (user.status === 'unverified') {
            const { protocol } = req;

            mailer({
              name: username,
              receiver: email,
              subject: 'Welcome to ErrorSwag',
              templateName: 'confirm_account',
              confirm_account_url: `${protocol}://${req.get(
                'host'
              )}/api/v1/auth/verify/${token}`
            });

            return responseGenerator.sendSuccess(
              res,
              200,
              {
                token
              },
              `Account has not been activated. Kindly check your email address for a verification link.`
            );
          }

          if (user.status === 'inactive') {
            return responseGenerator.sendSuccess(
              res,
              200,
              {
                token
              },
              `Your account has been deactivated. Kindly contact support for help.`
            );
          }
          return responseGenerator.sendSuccess(res, 200, {
            username,
            email,
            role,
            status,
            token
          });
        }
      }

      return responseGenerator.sendError(res, 401, 'Invalid user credentials.');
    } catch (error) {
      return responseGenerator.sendError(res, 500, error.message);
    }
  }

  /**
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- return updated row in json format
   * @memberof UserController
   */
  static async verifyUser(req, res) {
    const { email } = req.currentUser;

    try {
      const user = await BaseRepository.findOneByField(db.User, { email });

      if (user && user.status !== 'active') {
        const updatedUser = await BaseRepository.update(
          db.User,
          { status: 'active' },
          { email }
        );

        if (updatedUser > 0) {
          return responseGenerator.sendSuccess(
            res,
            200,
            null,
            'Your account has been activated.'
          );
        }
      }

      return responseGenerator.sendError(res, 400, 'Invalid validation token.');
    } catch (error) {
      return responseGenerator.sendError(res, 500, error);
    }
  }

  /**
   *
   *
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object} - return user's updated data
   * @memberof UserController
   */
  static async updateProfile(req, res) {
    try {
      const { avatar, bio } = req.body;
      const { id: userId } = req.currentUser;

      await BaseRepository.update(db.User, { avatar, bio }, { id: userId });

      return responseGenerator.sendSuccess(
        res,
        200,
        null,
        'Record successfully updated'
      );
    } catch (error) {
      return responseGenerator.sendError(res, 500, error.message);
    }
  }

  /**
   *
   *
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object} - returns number of rows updated
   * @memberof UserController
   */
  static async updateRole(req, res) {
    try {
      const { role } = req.body;
      const { id } = req.params;
      const findId = await BaseRepository.findOneByField(db.User, { id });
      if (findId) {
        const userObject = await BaseRepository.update(
          db.User,
          { role },
          { id }
        );
        return responseGenerator.sendSuccess(res, 200, { userObject });
      }
      return responseGenerator.sendError(res, 400, 'Invalid User ID');
    } catch (error) {
      return responseGenerator.sendError(res, 500, error.message);
    }
  }

  /**
   *
   *
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object} - return user's  object data
   * @memberof UserController
   */
  static async viewProfile(req, res) {
    try {
      const { id } = req.params;
      const userObject = await BaseRepository.findOneByField(db.User, {
        id,
        status: 'active'
      });
      if (userObject) {
        return responseGenerator.sendSuccess(res, 200, userObject);
      }
      return responseGenerator.sendError(res, 400, 'Invalid User ID');
    } catch (error) {
      return responseGenerator.sendError(res, 500, error.message);
    }
  }

  /**
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- returns information about the follow status of the requested user
   * @memberof UserController
   */
  static async followUser(req, res) {
    try {
      //  Please inform team to change the id of the decrypted user to id when been parsed with req object
      const { followeeId } = req.body;
      const { id: followerId } = req.currentUser;
      const details = { followeeId, followerId };
      const followedUser = await BaseRepository.findOrCreate(
        db.Follower,
        details
      );
      const [user, created] = followedUser;

      if (created) {
        return responseGenerator.sendSuccess(
          res,
          200,
          null,
          `You just followed the user with id = ${followeeId}`
        );
      }
      return responseGenerator.sendError(
        res,
        400,
        `You were already following the user with id = ${followeeId}`
      );
    } catch (err) {
      return responseGenerator.sendError(res, 500, err.message);
    }
  }

  /**
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- returns information about the follow status of the requested user
   * @memberof UserController
   */
  static async unfollowUser(req, res) {
    try {
      const { followeeId } = req.body;
      const { id: followerId } = req.currentUser;

      const details = {
        followerId,
        followeeId
      };

      const follower = await BaseRepository.findOneByField(
        db.Follower,
        details
      );
      if (!follower) {
        return responseGenerator.sendError(
          res,
          400,
          `You were not following this user`
        );
      }
      await BaseRepository.remove(db.Follower, details);
      return responseGenerator.sendSuccess(
        res,
        200,
        null,
        `You have succesfully unfollowed user with id =${followeeId}`
      );
    } catch (err) {
      return responseGenerator.sendError(res, 500, err.message);
    }
  }

  /**
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- returns information about the follow status of the requested user
   * @memberof UserController
   */
  static async getFollowers(req, res) {
    const { id: followeeId } = req.currentUser;
    // const followers = await BaseRepository.findAll(db.Follower, { followeeId });
    const followers = await BaseRepository.findAndInclude(
      db.Follower,
      { followeeId },
      db.User,
      'followed'
    );
    if (followers.length > 1) {
      return responseGenerator.sendSuccess(res, 200, followers);
    }
    return responseGenerator.sendError(
      res,
      200,
      `You do not have any followers at the moment`
    );
  }

  /**
   * @static
   * @param {object} req - express request object
   * @param {object} res - express response object
   * @returns {object}- returns information about the follow status of the requested user
   * @memberof UserController
   */
  static async getFollowings(req, res) {
    const { id: followerId } = req.currentUser;
    const followings = await BaseRepository.findAndInclude(
      db.Follower,
      { followerId },
      db.User,
      'followed'
    );
    if (followings.length > 1) {
      return responseGenerator.sendSuccess(res, 200, followings);
    }
    return responseGenerator.sendError(
      res,
      200,
      `You are not following anyone at the moment`
    );
  }

  /**
   * Get users and their corresponding profiles
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @return {json} Returns json object
   * @static
   */
  static async listUsers(req, res) {
    try {
      const { page } = req.query;
      const paginate = new Pagination(page, req.query.limit);
      const { limit, offset } = paginate.getQueryMetadata();
      const { count, rows: users } = await BaseRepository.findAndCountAll(
        db.User,
        {
          limit,
          offset,
          attributes: ['id', 'username', 'email', 'avatar', 'role', 'status']
        }
      );
      return responseGenerator.sendSuccess(
        res,
        200,
        users,
        paginate.getPageMetadata(count, '/api/v1/users')
      );
    } catch (error) {
      return responseGenerator.sendError(res, 500, error.message);
    }
  }
}
export default UserController;
