import { expect } from 'chai';
import Pagination from '../helpers/pagination';

const page = 2;
const limit = 1;
const totalItems = 4;
const paginate = new Pagination(page, limit);

describe('Pagination', () => {
  it('should return pagination metadata', () => {
    const metadata = paginate.getQueryMetadata();

    expect(metadata.limit).to.equal(1);
    expect(metadata.offset).to.equal(1);
  });

  it('should return page metadata without extra query if there is none', () => {
    const metadata = paginate.getPageMetadata(totalItems, '/url');

    expect(metadata.prev).to.equal('/url?page=1&limit=1');
    expect(metadata.currentPage).to.equal(2);
    expect(metadata.next).to.equal('/url?page=3&limit=1');
    expect(metadata.totalPages).to.equal(4);
    expect(metadata.totalItems).to.equal(4);
  });

  it('should return page metadata without extra query if there is an extra query', () => {
    const metadata = paginate.getPageMetadata(4, '/url', 'date=2019-06-18');

    expect(metadata.prev).to.equal('/url?date=2019-06-18page=1&limit=1');
    expect(metadata.currentPage).to.equal(2);
    expect(metadata.next).to.equal('/url?date=2019-06-18page=3&limit=1');
    expect(metadata.totalPages).to.equal(4);
    expect(metadata.totalItems).to.equal(4);
  });
});
