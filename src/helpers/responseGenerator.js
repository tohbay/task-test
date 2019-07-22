import utility from './utils';

const responseGenerator = {
  /**
   * @param {*} res - express response object
   * @param {*} statusCode - response status code
   * @param {*} [message=''] - error message
   * @returns {object} return a failed response
   */
  sendError(res, statusCode, message = '') {
    return res.status(statusCode).send({
      message
    });
  },

  /**
   * @param {object} res - express response object
   * @param {int} statusCode - response status code
   * @param {*} data - takes an array or object of data
   * @param {string} [message=''] - error message
   * @param {string} [metadata=''] - pagination showing offset and limit of list
   * @returns {object} return a success response
   */
  sendSuccess(res, statusCode, data, message = '', metadata = '') {
    const filteredResponse = utility.stripNull({
      metadata,
      message,
      data
    });
    return res.status(statusCode).send(filteredResponse);
  }
};

export default responseGenerator;
