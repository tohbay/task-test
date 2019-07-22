const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const paginationValidations = (req, res, next) => {
  // VALIDATE PAGE NUMBER
  let { page, limit } = req.query;
  if (!Number.isInteger(Number(page)) || page < 1) {
    page = DEFAULT_PAGE;
  }
  // VALIDATE LIMIT NUMBER
  if (!Number.isInteger(Number(limit)) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }

  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  req.query = {
    page,
    limit
  };
  next();
};

export default paginationValidations;
