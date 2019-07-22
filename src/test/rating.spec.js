import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../index';
import sign from '../helpers/utils';
import db from '../database/models';
import BaseRepository from '../repository/base.repository';
import {
  generateArticle,
  ratings,
  createUser,
  createArticle
} from './utils/helpers';

chai.use(chaiHttp);
chai.should();

const { User, Article, Rating } = db;

describe('PATCH, /api/v1/articles/:id/ratings', () => {
  beforeEach(async () => {
    await User.destroy({ truncate: true, cascade: true });
    await Rating.destroy({ truncate: true, cascade: true });
    await Article.destroy({ truncate: true, cascade: true });
  });
  it('Returns a 400 status code and an error message if the token was not set', done => {
    chai
      .request(app)
      .patch('/api/v1/articles/:articleId/ratings')
      .end((error, response) => {
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Invalid access token');
        done();
      });
  });
  it('Returns an error message if the article Id is not valid', async () => {
    const newUser = await createUser();
    const token = sign.jwtSigner(newUser);

    const response = await chai
      .request(app)
      .patch(`/api/v1/articles/${'foo'}/ratings`)
      .send(ratings)
      .set('x-access-token', token);
    expect(response.body.message).to.equal('articleId must be a number');
  });
  it('Returns an error message if the ratings passed is not a number', async () => {
    const newUser = await createUser();
    const token = sign.jwtSigner(newUser);

    const response = await chai
      .request(app)
      .patch(`/api/v1/articles/${1}/ratings`)
      .set('x-access-token', token)
      .send({ ratings: 'free' });
    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal(
      'ratings must be a number between 1 and 5'
    );
  });
  it('Returns a 403 if an author tries ratings his/her article', async () => {
    const newUser = await createUser();
    const token = sign.jwtSigner(newUser);
    const article = await generateArticle({ authorId: newUser.id });
    const createdArticle = await createArticle(article);
    const initialRating = await BaseRepository.findAndCountAll(Rating, {});
    expect(newUser.id).to.equal(createdArticle.authorId);
    const response = await chai
      .request(app)
      .patch(`/api/v1/articles/${createdArticle.id}/ratings`)
      .set('x-access-token', token)
      .send(ratings);
    expect(response.status).to.equal(403);
    expect(response.body.message).to.equal('You cannot rate your article');
    const finalRating = await BaseRepository.findAndCountAll(Rating, {});
    expect(initialRating.count).to.equal(finalRating.count);
  });
  it('Should return status 200 if the request was successful', async () => {
    const newUser = await createUser();
    const token = sign.jwtSigner(newUser);
    const secondUser = await createUser();
    const article = await generateArticle({ authorId: secondUser.id });
    const createdArticle = await createArticle(article);
    expect(secondUser.id).to.equal(createdArticle.authorId);
    const response = await chai
      .request(app)
      .patch(`/api/v1/articles/${createdArticle.id}/ratings`)
      .set('x-access-token', token)
      .send(ratings);
    expect(response.status).to.equal(200);
    expect(response.body.data.articleId).to.equal(createdArticle.id);
    expect(response.body.data.ratings).to.equal(ratings.ratings);
    const numberOfRatings = await BaseRepository.findAll(Rating, {});
    expect(numberOfRatings.length).to.equal(1);
  });
  it('Should return message if the article to be rated was not found', async () => {
    const newUser = await createUser();
    const token = sign.jwtSigner(newUser);
    const response = await chai
      .request(app)
      .patch(`/api/v1/articles/${1}/ratings`)
      .set('x-access-token', token)
      .send(ratings);
    expect(response.status).to.equal(404);
    expect(response.body.message).to.have.equal(
      'The requested article was not found'
    );
  });
});
