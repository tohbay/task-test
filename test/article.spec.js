import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import app from '../index';
import BaseRepository from '../repository/base.repository';
import { createUser, createArticle, generateArticle } from './utils/helpers';
import db from '../database/models';
import helper from '../helpers/utils';
import {
  articleSample,
  articleWithNoTitle,
  articleWithNoDescription,
  articleWithNoBody,
  articleWithNoImage
} from './mockdata/mock_article_data';

const ARTICLES_API = '/api/v1/articles';

chai.use(chaiHttp);

const server = () => chai.request(app);

describe('PATCH api/v1/articles/bookmark', () => {
  beforeEach(async () => {
    await db.Bookmark.destroy({ cascade: true, truncate: true });
    await db.User.destroy({ cascade: true, truncate: true });
  });
  it('should bookmark an article', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const theArticle = await createArticle(
      await generateArticle({ authorId: secondUser.id })
    );
    const numberOfArticles = await BaseRepository.findAll(db.Article);
    const numberOfBookmarks = await BaseRepository.findAndCountAll(
      db.Bookmark,
      {
        userId: firstUser.id
      }
    );
    const token = helper.jwtSigner(firstUser);
    expect(numberOfArticles.length).to.equal(1);
    expect(numberOfBookmarks.count).to.equal(0);

    const res = await server()
      .patch(`${ARTICLES_API}/bookmark`)
      .set('token', token)
      .send({ articleId: theArticle.id });
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Article Bookmarked successfully');

    const allUserBookmarks = await BaseRepository.findAll(db.Bookmark, {
      userId: firstUser.id
    });
    expect(allUserBookmarks.length).to.equal(1);
    expect(allUserBookmarks[0].articleId).to.equal(theArticle.id);
  });

  it('should remove a bookmark', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const theArticle = await createArticle(
      await generateArticle({ authorId: secondUser.id })
    );
    await BaseRepository.create(db.Bookmark, {
      userId: firstUser.id,
      articleId: theArticle.id
    });
    const numberOfBookmarks = await BaseRepository.findAll(db.Bookmark, {
      userId: firstUser.id
    });

    const token = helper.jwtSigner(firstUser);
    expect(numberOfBookmarks.length).to.equal(1);

    const res = await server()
      .patch(`${ARTICLES_API}/unbookmark`)
      .set('token', token)
      .send({ articleId: theArticle.id });
    expect(res.status).to.equal(200);

    const currentNumberOfBookmarks = await BaseRepository.findAll(db.Bookmark, {
      userId: firstUser.id
    });

    expect(currentNumberOfBookmarks.length).to.equal(0);
  });
});

describe('PATCH api/v1/articles/bookmark', () => {
  beforeEach(async () => {
    await db.Bookmark.destroy({ cascade: true, truncate: true });
    await db.User.destroy({ cascade: true, truncate: true });
  });

  it('should get all bookmarks for a user', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const theArticle = await createArticle(
      await generateArticle({ authorId: secondUser.id })
    );
    const numberOfBookmarks = await BaseRepository.findAll(db.Bookmark, {
      userId: firstUser.id
    });
    expect(numberOfBookmarks.length).to.equal(0);
    await BaseRepository.create(db.Bookmark, {
      userId: firstUser.id,
      articleId: theArticle.id
    });
    const newNumberOfBookmarks = await BaseRepository.findAll(db.Bookmark, {
      userId: firstUser.id
    });
    expect(newNumberOfBookmarks.length).to.equal(1);

    const token = helper.jwtSigner(firstUser);

    const res = await server()
      .get(`${ARTICLES_API}/bookmark`)
      .set('token', token);
    expect(res.status).to.equal(200);

    expect(res.body.message[0].articleId).to.equal(theArticle.id);
    expect(res.body.message[0].secondUser).to.equal(theArticle.userId);
  });

  it('should get no bookmarks for the user', async () => {
    const firstUser = await createUser();

    const numberOfBookmarks = await BaseRepository.findAndCountAll(
      db.Bookmark,
      {
        userId: firstUser.id
      }
    );
    expect(numberOfBookmarks.count).to.equal(0);

    const token = helper.jwtSigner(firstUser);

    const res = await server()
      .patch(`${ARTICLES_API}/bookmark`)
      .set('token', token);
    expect(res.status).to.equal(400);

    const newNumberOfBookmarks = await BaseRepository.findAndCountAll(
      db.Bookmark,
      {
        userId: firstUser.id
      }
    );
    expect(newNumberOfBookmarks.count).to.equal(0);
  });
});

describe('GET api/v1/articles', () => {
  beforeEach(async () => {
    await db.Article.destroy({ cascade: true, truncate: true });
    await db.User.destroy({ cascade: true, truncate: true });
  });

  it('should get a list of all articles', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const theArticle = await createArticle(
      await generateArticle({ authorId: secondUser.id })
    );

    const numberOfArticles = await BaseRepository.findAndCountAll(db.Article);
    const token = helper.jwtSigner(firstUser);
    expect(numberOfArticles.count).to.equal(1);

    const res = await server()
      .get(`${ARTICLES_API}`)
      .set('token', token);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].id).to.equal(theArticle.id);
    expect(res.body.data[0].authorId).to.equal(secondUser.id);
    expect(res.body.data[0].title).to.equal(theArticle.title);
    expect(res.body.data[0].body).to.equal(theArticle.body);
    expect(res.body.data[0].image).to.equal(theArticle.image);
  });

  it('should list articles with pagaination', async () => {
    const firstUser = await createUser();
    await createArticle(await generateArticle({ authorId: firstUser.id }));
    await createArticle(await generateArticle({ authorId: firstUser.id }));
    await createArticle(await generateArticle({ authorId: firstUser.id }));
    await createArticle(await generateArticle({ authorId: firstUser.id }));
    await createArticle(await generateArticle({ authorId: firstUser.id }));

    const numberOfArticles = await BaseRepository.findAndCountAll(db.Article);
    const token = helper.jwtSigner(firstUser);
    expect(numberOfArticles.count).to.equal(5);
    const page = 2;
    const limit = 2;
    const res = await server()
      .get(`${ARTICLES_API}?page=${page}&limit=${limit}`)
      .set('token', token);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
    expect(res.body.metadata.prev).to.equal(`${ARTICLES_API}?page=1&limit=2`);
    expect(res.body.metadata.currentPage).to.equal(2);
    expect(res.body.metadata.next).to.equal(`${ARTICLES_API}?page=3&limit=2`);
    expect(res.body.metadata.totalPages).to.equal(3);
    expect(res.body.metadata.totalItems).to.equal(5);
  });

  it('should return error if database error occurs', done => {
    const findAllStub = sinon.stub(BaseRepository, 'findAndCountAll');
    findAllStub.rejects();
    const userUrl = '/api/v1/articles';
    chai
      .request(app)
      .get(userUrl)
      .end((err, res) => {
        expect(res.status).to.equal(500);
        findAllStub.restore();
        done();
      });
  });
});

describe('POST api/v1/articles/', () => {
  it('should throw a 400 status code when creating an article with invalid token', async () => {
    beforeEach(async () => {
      await db.Bookmark.destroy({ cascade: true, truncate: true });
      await db.User.destroy({ cascade: true, truncate: true });
      await db.Article.destroy({ cascade: true, truncate: true });
    });

    const token = 'helper.jwtSigner(newUser);';

    const response = await server()
      .post(`${ARTICLES_API}`)
      .set('x-access-token', token)
      .send(articleWithNoTitle);
    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal('Token is not valid');
  });

  it('should successfully create an article with valid user input', async () => {
    beforeEach(async () => {
      await db.Bookmark.destroy({ cascade: true, truncate: true });
      await db.User.destroy({ cascade: true, truncate: true });
      await db.Article.destroy({ cascade: true, truncate: true });
    });
    const newUser = await createUser();
    const token = helper.jwtSigner(newUser);

    const response = await server()
      .post(`${ARTICLES_API}`)
      .set('x-access-token', token)
      .send(articleSample);
    expect(response.status).to.equal(201);
    expect(response.body.data.authorId).to.equal(newUser.id);
    expect(response.body.data.title).to.equal(articleSample.title);
    expect(response.body.data.body).to.equal(articleSample.body);
    expect(response.body.data.image).to.equal(articleSample.image);
    expect(response.body.data).to.have.property('slug');
    expect(response.body.data.slug).to.not.equal(articleSample.slug);
    expect(response.body.data.slug).to.be.a('string');
    expect(response.body.data.status).to.equal('active');
    expect(response.body.data.publishedDate).to.equal(null);
  });

  it('should throw a 400 status code when creating an article with no title', async () => {
    beforeEach(async () => {
      await db.Bookmark.destroy({ cascade: true, truncate: true });
      await db.User.destroy({ cascade: true, truncate: true });
      await db.Article.destroy({ cascade: true, truncate: true });
    });
    const newUser = await createUser();
    const token = helper.jwtSigner(newUser);

    const response = await server()
      .post(`${ARTICLES_API}`)
      .set('x-access-token', token)
      .send(articleWithNoTitle);
    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal(
      'Please provide a title for your article with minimum of 3 characters'
    );
  });

  it('should throw a 400 server error when creating an article without a description', async () => {
    beforeEach(async () => {
      await db.Bookmark.destroy({ cascade: true, truncate: true });
      await db.User.destroy({ cascade: true, truncate: true });
      await db.Article.destroy({ cascade: true, truncate: true });
    });
    const newUser = await createUser();
    const token = helper.jwtSigner(newUser);
    const response = await chai
      .request(app)
      .post(ARTICLES_API)
      .set('x-access-token', token)
      .send(articleWithNoDescription);
    expect(response.status).to.equal(400);
    expect(response.message).to.equal(response.message);
  });

  it('should throw a 400 server error when creating an article without a body', async () => {
    beforeEach(async () => {
      await db.Bookmark.destroy({ cascade: true, truncate: true });
      await db.User.destroy({ cascade: true, truncate: true });
      await db.Article.destroy({ cascade: true, truncate: true });
    });
    const newUser = await createUser();
    const token = helper.jwtSigner(newUser);
    const response = await chai
      .request(app)
      .post(ARTICLES_API)
      .set('x-access-token', token)
      .send(articleWithNoBody);
    expect(response.status).to.equal(400);
    expect(response.message).to.equal(response.message);
  });

  it('should throw a 400 server error when creating an article without an image', async () => {
    beforeEach(async () => {
      await db.Bookmark.destroy({ cascade: true, truncate: true });
      await db.User.destroy({ cascade: true, truncate: true });
      await db.Article.destroy({ cascade: true, truncate: true });
    });
    const newUser = await createUser();
    const token = helper.jwtSigner(newUser);
    const response = await chai
      .request(app)
      .post(ARTICLES_API)
      .set('x-access-token', token)
      .send(articleWithNoImage);
    expect(response.status).to.equal(400);
    expect(response.message).to.equal(response.message);
  });
});
