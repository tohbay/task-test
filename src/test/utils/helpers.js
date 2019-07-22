import faker from 'faker';
import db from '../../database/models';
import BaseRepository from '../../repository/base.repository';

export const getUser = async () => ({
  username: faker.internet.userName().toLowerCase(),
  email: faker.internet.email().toLowerCase(),
  avatar: faker.image.imageUrl().toLowerCase(),
  password: faker.internet.password().toLowerCase(),
  role: 'user',
  status: 'unverified'
});

export const createUser = async theUser => {
  const created = await BaseRepository.create(
    db.User,
    theUser || (await getUser())
  );
  const plain = await created.get({ plain: true });
  return plain;
};

export const generateArticle = async ({ authorId }) => ({
  title: faker.lorem.word(),
  body: faker.lorem.sentences(),
  image: faker.image.imageUrl(),
  publishedDate: new Date(),
  authorId,
  slug: faker.lorem.slug(),
  description: faker.lorem.word(),
  status: 'active'
});

export const createArticle = async article => {
  const created = await BaseRepository.create(db.Article, article);
  const plain = await created.get({ plain: true });
  return plain;
};

export const followUser = async (firstId, secondId) => {
  await BaseRepository.create({
    followerId: secondId,
    followeeId: firstId
  });
};

export const ratings = {
  ratings: faker.random.number({
    min: 1,
    max: 5
  })
};
