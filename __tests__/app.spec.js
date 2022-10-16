import { describe, expect, test } from '@jest/globals';
import App from '../src/app';
import IndexRoute from '../src/routes/index.route';
import { connect, disconnect } from './db';
import supertest from 'supertest';

const routes = [new IndexRoute()];
const app = new App(routes).app;
const request = supertest(app);

// test database and root route
describe('Test request with mongoose', () => {
  beforeAll(() => {
    connect();
  });

  afterAll((done) => {
    disconnect(done);
  });

  test('GET - /', async () => {
    const res = await request.get('/').send();
    expect(res.statusCode).toBe(200);
  });
});
