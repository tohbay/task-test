import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../index';

chai.use(chaiHttp);

describe('Testing Unit Test Setup with Mocha', () => {
  it('It should ensure that a response status of 200 was given by the server', done => {
    const appUrl = '/welcome';
    chai
      .request(app)
      .get(appUrl)
      .end((error, response) => {
        expect(response.status).to.equal(200);
        done();
      });
  });

  it('It should ensure that a message was shown on the browser on successful server response', done => {
    const appUrl = '/welcome';
    chai
      .request(app)
      .get(appUrl)
      .end((error, response) => {
        expect(response.body.message).to.equal(
          'Welcome to the ErrorSwag backend page'
        );
        done();
      });
  });

  it('It should throw an error for an invalid url', done => {
    const appUrl = '/uuu';
    chai
      .request(app)
      .get(appUrl)
      .end((error, res) => {
        expect(res.status).to.equal(404);
        expect(res.body.message).to.equal('Page Not Found on ErrorSwag');
        done();
      });
  });
});
