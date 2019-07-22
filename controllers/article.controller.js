import crypto from 'crypto';
import slug from 'slug';
import BaseRepository from '../repository/base.repository';
import responseGenerator from '../helpers/responseGenerator';
import db from '../database/models';
import Pagination from '../helpers/pagination';

/**
 * @class UserController
 */
class ArticleController {
  /**
   * Get users and their corresponding profiles
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @return {json} Returns json object
   * @static
   */
  static async fetchAllArticles(req, res) {
    try {
      const { page } = req.query;
      const paginate = new Pagination(page, req.query.limit);
      const { limit, offset } = paginate.getQueryMetadata();
      const { count, rows: articles } = await BaseRepository.findAndCountAll(
        db.Article,
        {
          limit,
          offset,
          attributes: [
            'id',
            'authorId',
            'title',
            'body',
            'image',
            'publishedDate',
            'status'
          ]
        }
      );
      return responseGenerator.sendSuccess(
        res,
        200,
        articles,
        null,
        paginate.getPageMetadata(count, '/api/v1/articles')
      );
    } catch (error) {
      return responseGenerator.sendError(res, 500, error.message);
    }
  }

  /**
   * Get all bookmarked articles
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @return {json} Returns json object
   * @static
   */
  static async getBookMarks(req, res) {
    const { id: userId } = req.currentUser;

    const allBookMarks = await BaseRepository.findAndInclude(
      db.Bookmark,
      { userId },
      db.Article,
      'article'
    );

    if (allBookMarks.length < 1) {
      return responseGenerator.sendError(
        res,
        400,
        `You currently do not have any article in your bookmark`
      );
    }
    return responseGenerator.sendSuccess(res, 200, null, allBookMarks);
  }

  /**
   * Add article to bookmarks
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @return {json} Returns json object
   * @static
   */
  static async addBookMark(req, res) {
    const { id: userId } = req.currentUser;
    const { articleId } = req.body;

    await BaseRepository.findOrCreate(
      db.Bookmark,
      { articleId, userId },
      { articleId, userId }
    );

    return responseGenerator.sendSuccess(
      res,
      200,
      null,
      'Article Bookmarked successfully'
    );
  }

  /**
   * Remove article from bookmarks
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @return {json} Returns json object
   * @static
   */
  static async removeBookMark(req, res) {
    const { articleId } = req.body;
    const { id: userId } = req.currentUser;
    await BaseRepository.remove(db.Bookmark, {
      articleId,
      userId
    });
    return responseGenerator.sendSuccess(
      res,
      200,
      null,
      `article with id = ${articleId} has been successfully removed from your bookmarks`
    );
  }

  /**
   *
   *
   * @static
   * @param {*} request -- Request object
   * @param {*} response -- Response object
   * @returns {json} -- Returns a json object
   * @memberof ArticleController
   */
  static async createArticle(request, response) {
    const { id: authorId } = request.currentUser;
    const { title, description, body, image } = request.body;
    const article = await BaseRepository.create(db.Article, {
      ...request.body,
      slug: slug(
        `${title}-${crypto.randomBytes(12).toString('base64')}`
      ).toLowerCase(),
      authorId
    });
    return responseGenerator.sendSuccess(
      response,
      201,
      article,
      'Artilcle successfully created'
    );
  }
}
export default ArticleController;
