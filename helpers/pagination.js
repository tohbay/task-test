/**
 * @class
 * @classdesc - Pagination Class
 */
class Pagination {
  /**
   * @constructor
   * @memberof Pagination
   * @param {number|string} page
   * @param {number|string} limit
   */
  constructor(page = 1, limit = 10) {
    this.page = Number(page, 10);
    this.limit = Number(limit, 10);
  }

  /**
   *
   *
   * @returns {object} - an object that returns query metadata
   * @memberof Pagination
   */
  getQueryMetadata() {
    return { limit: this.limit, offset: this.limit * (this.page - 1) };
  }

  /**
   * @memberof Pagination
   * @param {array} totalItems
   * @param {string} baseUrl
   * @param {string} extraQuery
   * @return {object} - an object that returns page metadata
   */
  getPageMetadata(totalItems, baseUrl, extraQuery = '') {
    const { page, limit } = this;

    const totalPages = Math.ceil(totalItems / limit);
    const prev =
      page > 1
        ? `${baseUrl}?${extraQuery}page=${page - 1}&limit=${limit}`
        : null;
    const currentPage = page;
    const next =
      page < totalPages
        ? `${baseUrl}?${extraQuery}page=${page + 1}&limit=${limit}`
        : null;

    return {
      prev,
      currentPage,
      next,
      totalPages,
      totalItems
    };
  }
}

export default Pagination;
