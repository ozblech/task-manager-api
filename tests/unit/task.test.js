// Set this BEFORE importing any code that uses JWT
process.env.JWT_SECRET = 'thisismysecret';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');

const testUserId = new mongoose.Types.ObjectId();
const testUser = {
  _id: testUserId,
  name: 'Task Tester',
  email: 'tasktester@example.com',
  password: 'MyPass123',
};

const otherUserId = new mongoose.Types.ObjectId();
const otherUser = {
  _id: otherUserId,
  name: 'Other',
  email: 'other@example.com',
  password: 'pass123123',
};

const testTask = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Test task',
  completed: false,
  owner: testUserId
};

let user;
let other_user;
let token;
let other_token;

beforeAll(async () => {
  const dbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  await mongoose.connect(dbUrl);
});

beforeEach(async () => {
  await User.deleteMany();
  await Task.deleteMany();

  user = new User(testUser);
  token = await user.generateAuthToken();

  other_user = new User(otherUser);
  other_token = await other_user.generateAuthToken();

  await new Task({ ...testTask, owner: user._id }).save();

  // ✅ Workaround for race condition in test environments
  // After user.save()
  let retries = 5;
  while (retries--) {
    const fresh = await User.findOne({ _id: user._id, 'tokens.token': token });
    if (fresh) break;
    await new Promise((res) => setTimeout(res, 20));
}
});

afterAll(async () => {
  await mongoose.disconnect();
});

test('Should create task for user', async () => {
  const users = await User.find({});
  console.log('Users in DB:');
  console.log(JSON.stringify(users, null, 2));
  console.log('User should be created');
  console.log('User:', user);
  console.log('User token:', user.tokens[0].token);
  console.log('User token:', token);
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      description: 'New test task'
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toBe(false);
});

test('Should fetch user tasks', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
  expect(response.body[0]._id).toBe(testTask._id.toHexString());
});

test('Should not delete task of other users', async () => {
  await request(app)
    .delete(`/tasks/${testTask._id}`)
    .set('Authorization', `Bearer ${other_token}`)
    .send()
    .expect(404);

  const task = await Task.findById(testTask._id);
  expect(task).not.toBeNull();
});

