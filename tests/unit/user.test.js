const request = require('supertest')
const app = require('../../src/index');
const User = require('../../src/models/user')
const { connectToDB, disconnectFromDB } = require('../../src/db/mongoose');

// mock SendGrid functions
jest.mock('../../src/emails/account', () => ({
  sendWelcomeEmail: jest.fn(),
  sendCancelEmail: jest.fn(),
}))

beforeAll(async () => {
    await connectToDB();
  });
  

afterEach(async () => {
  await User.deleteMany()
})

afterAll(async () => {
  await disconnectFromDB();
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'MyPass777!'
    })
    .expect(201)

  // Check if user is saved to DB
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Check response contains user and token
  expect(response.body).toMatchObject({
    user: {
      name: 'Test User',
      email: 'test@example.com'
    },
    token: user.tokens[0].token
  })

  // Ensure password is hashed
  expect(user.password).not.toBe('MyPass777!')
})
