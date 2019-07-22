import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import nock from 'nock';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import app from '../index';

import BaseRepository from '../repository/base.repository';
import { createUser, getUser } from './utils/helpers';
import db from '../database/models';
import helper from '../helpers/utils';

const USER_API = '/api/v1/users';

config();
chai.use(chaiHttp);

const server = () => chai.request(app);

describe('Test user login, signup and account verification', () => {
  describe('POST /auth/signup', () => {
    beforeEach(async () => {
      await db.User.destroy({ cascade: true, truncate: true });
    });
    it('should create a user account', async () => {
      const newUser = await getUser();

      const res = await server()
        .post('/api/v1/auth/signup')
        .send(newUser);

      const user = await BaseRepository.findAll(db.User, {
        id: newUser.id
      });

      expect(res.status).to.equal(201);
      expect(user.length).to.equal(1);
      expect(user[0].email).to.equal(newUser.email);
      expect(user[0].username).to.equal(newUser.username);
      expect(res.body.data)
        .to.have.property('status')
        .to.equal('unverified');
    });

    it('should send an account verification mail to user on successful account creation', async () => {
      nock('https://api.sendgrid.com')
        .post('/api/mail.send.json')
        .reply(202, {
          statusMessage: 'Accepted'
        });

      const res = await chai
        .request('https://api.sendgrid.com')
        .post('/api/mail.send.json');
      expect(res.status).to.equal(202);
      expect(res.body.statusMessage).to.equal('Accepted');
    });

    it('should throw an error if an error occured while sending mail', async () => {
      nock('https://api.sendgrid.com')
        .post('/api/mail.send.json')
        .reply(400, {
          message: 'Failed'
        });

      const res = await chai
        .request('https://api.sendgrid.com')
        .post('/api/mail.send.json');
      expect(res.body.message).to.equal('Failed');
      expect(res.status).to.equal(400);
    });

    it('should throw an error when user with an unverified account wants to signup', async () => {
      const user = await getUser();
      user.email = 'jonsnow@got.com';
      user.status = 'unverified';

      const createdUser = await createUser(user);
      const res = await server()
        .post('/api/v1/auth/signup')
        .send(createdUser);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal(
        'This account is already registered. A verification link has been sent to your email. Check your email to continue.'
      );
    });

    it('should throw an error when user with an active account tries to signup', async () => {
      const user = await getUser();
      user.email = 'jonsnow@got.com';
      user.status = 'active';

      const createdUser = await createUser(user);

      const res = await server()
        .post('/api/v1/auth/signup')
        .send(createdUser);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal(
        'User with this email address already exist'
      );
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await db.User.destroy({ cascade: true, truncate: true });
    });
    it('should throw an error if email address is invalid', async () => {
      const user = await getUser();
      user.email = 'sholabolagmail.com';
      user.password = 'password';

      const res = await server()
        .post('/api/v1/auth/login')
        .send(user);
      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('email must be a valid email');
    });

    it('should throw an error if password is not up to 8', done => {
      const user = {
        email: 'sholabola@gmail.com',
        password: 'pass'
      };
      chai
        .request(app)
        .post('/api/v1/auth/login')
        .send(user)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.message).to.equal(
            'password length must be at least 8 characters long'
          );
          done();
        });
    });

    it('should throw if wrong credential is passed', done => {
      const user = {
        email: 'sholabola@yahoo.com',
        password: 'password'
      };
      chai
        .request(app)
        .post('/api/v1/auth/login')
        .send(user)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          expect(res.body.message).to.equal('Invalid user credentials.');
          done();
        });
    });

    it('should login the user into an account', async () => {
      const user = await getUser();
      user.email = 'sholabola@yahoo.com';
      user.status = 'active';
      user.password = 'password';

      await createUser(user);

      const res = await server()
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      const { token } = res.body.data;

      await jwt.verify(token, process.env.JWT_SECRET, (error, decode) => {
        expect(error).to.be.an('null');

        const { username, email } = decode;

        expect(res.status).to.equal(200);
        expect(res.body.data)
          .to.have.property('username')
          .to.equal(username);
        expect(res.body.data)
          .to.have.property('email')
          .to.equal(email);
      });
    });

    it('should throw an error when an unverified user tries to login', async () => {
      const user = await getUser();
      user.email = 'sholabola@yahoo.com';
      user.status = 'unverified';
      user.password = 'password';

      await createUser(user);

      const res = await server()
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal(
        'Account has not been activated. Kindly check your email address for a verification link.'
      );
    });
  });

  describe('POST /auth/verify/:token', async () => {
    beforeEach(async () => {
      await db.User.destroy({ cascade: true, truncate: true });
    });

    it('should throw an error if an invalid token is provided', async () => {
      const invalidToken = 'jhfhje88e8';
      const res = await server().patch(`/api/v1/auth/verify/${invalidToken}`);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Token is not valid');
    });

    it('should verify a user', async () => {
      const user = await getUser();
      user.email = 'sholabola@yahoo.com';
      user.status = 'unverified';

      const createdUser = await createUser(user);
      const token = helper.jwtSigner(createdUser);

      const res = await server().patch(`/api/v1/auth/verify/${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Your account has been activated.');
    });

    it('should return error if validation token is invalid', async () => {
      const invalidToken = 'KJJJVJDVJD';

      const findAllStub = sinon.stub(BaseRepository, 'update');
      findAllStub.rejects();
      chai
        .request(app)
        .patch(`/api/v1/auth/verify/${invalidToken}`)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          findAllStub.restore();
        });
    });

    it('should return an error if database error occurs', async () => {
      const user = await getUser();
      user.email = 'sholabola@yahoo.com';
      user.status = 'unverified';

      const createdUser = await createUser(user);
      const token = helper.jwtSigner(createdUser);

      const findAllStub = sinon.stub(BaseRepository, 'findOneByField');
      findAllStub.rejects();
      chai
        .request(app)
        .patch(`/api/v1/auth/verify/${token}`)
        .end((err, res) => {
          expect(res.status).to.equal(500);
          findAllStub.restore();
        });
    });
  });
});

describe('GET api/v1/users', () => {
  beforeEach(async () => {
    await db.User.destroy({ cascade: true, truncate: true });
  });

  it('should successfully get a list of all users', async () => {
    await createUser();
    await createUser();
    await createUser();
    await createUser();

    const userUrl = '/api/v1/users';
    const res = await server().get(userUrl);

    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
    expect(res.body.data).to.have.lengthOf(4);

    const userObjectKeys = [
      'id',
      'username',
      'email',
      'status',
      'avatar',
      'role'
    ];

    expect(res.body.data[0]).to.have.all.keys(...userObjectKeys);
    expect(res.body.data[1]).to.have.all.keys(...userObjectKeys);
    expect(res.body.data[2]).to.have.all.keys(...userObjectKeys);
    expect(res.body.data[3]).to.have.all.keys(...userObjectKeys);
  });
});

it('should return error if database error occurs', done => {
  const findAllStub = sinon.stub(BaseRepository, 'findAndCountAll');
  findAllStub.rejects();
  const userUrl = '/api/v1/users';
  chai
    .request(app)
    .get(userUrl)
    .end((err, res) => {
      expect(res.status).to.equal(500);
      findAllStub.restore();
      done();
    });
});

describe('PATCH api/v1/users/follow', () => {
  beforeEach(async () => {
    await db.User.destroy({ cascade: true, truncate: true });
  });

  it('should follow another user', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    await createUser();
    const token = helper.jwtSigner(firstUser);

    const currentNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(currentNumberOfFollowing.length).to.equal(0);

    const res = await server()
      .patch(`${USER_API}/follow`)
      .set('token', token)
      .send({ followeeId: secondUser.id });
    expect(res.status).to.equal(200);

    const newNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(newNumberOfFollowing.length).to.equal(1);
    expect(newNumberOfFollowing[0].followerId).to.equal(firstUser.id);
    expect(newNumberOfFollowing[0].followeeId).to.equal(secondUser.id);
  });

  it('should not follow the same user twice', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    await createUser();
    const token = helper.jwtSigner(firstUser);

    const currentNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(currentNumberOfFollowing.length).to.equal(0);

    await server()
      .patch(`${USER_API}/follow`)
      .set('token', token)
      .send({ followeeId: secondUser.id });

    const newNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(newNumberOfFollowing.length).to.equal(1);
    expect(newNumberOfFollowing[0].followerId).to.equal(firstUser.id);
    expect(newNumberOfFollowing[0].followeeId).to.equal(secondUser.id);

    const res = await server()
      .patch(`${USER_API}/follow`)
      .set('token', token)
      .send({ followeeId: secondUser.id });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      `You were already following the user with id = ${secondUser.id}`
    );

    const latestNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(latestNumberOfFollowing.length).to.equal(1);
    expect(newNumberOfFollowing[0].followerId).to.equal(firstUser.id);
    expect(newNumberOfFollowing[0].followeeId).to.equal(secondUser.id);
  });

  it('should throw validation error if the followeeId is not a number', async () => {
    const firstUser = await createUser();
    await createUser();
    const token = helper.jwtSigner(firstUser);

    const numberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(numberOfFollowing.length).to.equal(0);

    const res = await server()
      .patch(`${USER_API}/follow`)
      .set('token', token)
      .send({ followeeId: 'abc' });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('followeeId must be a number');

    const newNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(newNumberOfFollowing.length).to.equal(0);
  });

  it('should not follow a non-existing user', async () => {
    const firstUser = await createUser();
    await createUser();
    const token = helper.jwtSigner(firstUser);
    const numberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(numberOfFollowing.length).to.equal(0);

    const res = await server()
      .patch(`${USER_API}/follow`)
      .set('token', token)
      .send({ followeeId: 8053032 });
    expect(res.status).to.equal(400);

    const newNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(newNumberOfFollowing.length).to.equal(0);
  });
});

describe('PATCH /api/v1/unfollow', () => {
  beforeEach(async () => {
    await db.User.destroy({ cascade: true, truncate: true });
  });

  it('should unfollow a user', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const token = helper.jwtSigner(firstUser);

    await server()
      .patch(`${USER_API}/follow`)
      .set('token', token)
      .send({ followeeId: secondUser.id });

    const numberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(numberOfFollowing.length).to.equal(1);
    expect(numberOfFollowing[0].followeeId).to.equal(secondUser.id);
    expect(numberOfFollowing[0].followerId).to.equal(firstUser.id);

    const res = await server()
      .patch(`${USER_API}/unfollow`)
      .set('token', token)
      .send({ followeeId: secondUser.id });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal(
      `You have succesfully unfollowed user with id =${secondUser.id}`
    );

    const currentNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(currentNumberOfFollowing.length).to.equal(0);
  });

  it('should not unfollow itself', async () => {
    const firstUser = await createUser();

    const token = helper.jwtSigner(firstUser);

    const numberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(numberOfFollowing.length).to.equal(0);

    const res = await server()
      .patch(`${USER_API}/unfollow`)
      .set('token', token)
      .send({ followeeId: firstUser.id });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(`You cannot follow or unfollow yourself`);

    const currentNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(currentNumberOfFollowing.length).to.equal(0);
  });

  it('should not unfollow a user it was not following', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();

    const token = helper.jwtSigner(firstUser);

    const numberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(numberOfFollowing.length).to.equal(0);

    const res = await server()
      .patch(`${USER_API}/unfollow`)
      .set('token', token)
      .send({ followeeId: secondUser.id });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(`You were not following this user`);

    const currentNumberOfFollowing = await BaseRepository.findAll(db.Follower, {
      followerId: firstUser.id
    });
    expect(currentNumberOfFollowing.length).to.equal(0);
  });
});

describe('Test for update user profile', () => {
  describe('PATCH api/v1/users/:id', () => {
    beforeEach(async () => {
      await db.User.destroy({ cascade: true, truncate: true });
    });

    it('should update user profile', async () => {
      const firstUser = await createUser();
      const numberOfUsers = await BaseRepository.findAll(db.User, {
        id: firstUser.id
      });
      const token = helper.jwtSigner(firstUser);
      expect(numberOfUsers.length).to.equal(1);

      const res = await server()
        .put(`${USER_API}/${firstUser.id}`)
        .set('token', token)
        .send({ bio: 'I am Nkechi', avatar: 'anythingdotimage.jpg' });

      expect(res.body.message).to.equal('Record successfully updated');
      expect(res.status).to.equal(200);

      const userProfile = await BaseRepository.findItAll(db.User, {
        id: firstUser.id
      });

      expect(userProfile[0].bio).to.equal('I am Nkechi');
      expect(userProfile[0].avatar).to.equal('anythingdotimage.jpg');
    });
  });
});

describe('Test for view user profile', () => {
  describe('GET api/v1/users/:id', () => {
    beforeEach(async () => {
      await db.User.destroy({ cascade: true, truncate: true });
    });

    it('should fetch specific user profile', async () => {
      const newUser = await createUser();
      const user = await BaseRepository.findAll(db.User, {
        id: newUser.id
      });
      expect(user.length).to.equal(1);
      const numRows = await BaseRepository.update(
        db.User,
        { status: 'active' },
        {
          id: newUser.id
        }
      );
      expect(numRows[0]).to.equal(1);
      const token = helper.jwtSigner(newUser);
      const res = await server()
        .get(`${USER_API}/${newUser.id}`)
        .set('token', token);
      expect(res.status).to.equal(200);
      expect(res.body.data.id).to.equal(newUser.id);
    });

    it('should not fetch specific user profile if USER ID is invalid', async () => {
      const newUser = await createUser();
      const user = await BaseRepository.findAll(db.User, {
        id: newUser.id
      });
      expect(user.length).to.equal(1);
      const token = helper.jwtSigner(newUser);
      const res = await server()
        .get(`${USER_API}/999999`)
        .set('token', token);
      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Invalid User ID');
    });
  });
});

describe('PATCH /api/v1/auth/user/:id/role', () => {
  beforeEach(async () => {
    await db.User.destroy({ cascade: true, truncate: true });
  });

  it(`should change a user's role to admin`, async () => {
    const theUser = await createUser();
    const getSuperAdmin = await getUser();
    getSuperAdmin.role = 'superadmin';
    const superAdmin = await createUser(getSuperAdmin);

    const numberOfUsers = await BaseRepository.findItAll(db.User);
    expect(numberOfUsers.length).to.equal(2);
    expect(numberOfUsers[0].role).to.equal('user');
    expect(numberOfUsers[1].role).to.equal('superadmin');
    const token = helper.jwtSigner(superAdmin);

    const res = await server()
      .patch(`${USER_API}/${theUser.id}/role`)
      .set('token', token)
      .send({ role: 'admin' });
    expect(res.status).to.equal(200);

    const userRoleStatus = await BaseRepository.findItAll(db.User, {
      id: theUser.id
    });
    expect(userRoleStatus[0].role).to.equal('admin');
  });

  it('should not change role if it is not a superadmin', async () => {
    const fistUser = await createUser();
    const secondUser = await createUser();

    const numberOfUsers = await BaseRepository.findItAll(db.User);
    expect(numberOfUsers.length).to.equal(2);
    expect(numberOfUsers[0].role).to.equal('user');
    expect(numberOfUsers[1].role).to.equal('user');

    const token = helper.jwtSigner(fistUser);

    const res = await server()
      .patch(`${USER_API}/${secondUser.id}/role`)
      .set('token', token)
      .send({ role: 'admin' });
    expect(res.status).to.equal(403);

    const userRoleStatus = await BaseRepository.findItAll(db.User, {
      id: secondUser.id
    });
    expect(userRoleStatus[0].role).to.not.equal('admin');
    expect(userRoleStatus[0].role).to.equal('user');
  });

  it('should not change role if it is not a superadmin', async () => {
    const getSuperAdmin = await getUser();
    getSuperAdmin.role = 'superadmin';
    const superAdmin = await createUser(getSuperAdmin);

    const numberOfUsers = await BaseRepository.findItAll(db.User);
    expect(numberOfUsers.length).to.equal(1);
    expect(numberOfUsers[0].role).to.equal('superadmin');

    const token = helper.jwtSigner(superAdmin);

    const res = await server()
      .patch(`${USER_API}/12345/role`)
      .set('token', token)
      .send({ role: 'admin' });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Invalid User ID');

    const userRoleStatus = await BaseRepository.findItAll(db.User, {
      id: superAdmin.id
    });

    expect(userRoleStatus[0].role).to.equal('superadmin');
    expect(userRoleStatus.length).to.equal(1);
  });
});
