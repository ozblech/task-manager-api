const request = require('supertest');
const app = require('../../src/index');
const User = require('../../src/models/user');
const { testUser, setupDatabase } = require('./setup');
const { connectToDB, disconnectFromDB } = require('../../src/db/mongoose');

beforeAll(async () => {
  await connectToDB();
});

afterAll(async () => {
  await disconnectFromDB();
});

beforeEach(async () => {
  await setupDatabase();
});

test('Should return profile for authenticated user', async () => {
  const response = await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.email).toBe(testUser.email);
});
