process.env.JWT_SECRET = 'thisismysecret';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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
  password: 'pass123',
};

const testTask = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Test task',
  completed: false,
  owner: testUserId
};

beforeAll(async () => {
  const dbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
  await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
});

let authToken;

beforeEach(async () => {
  await User.deleteMany();
  await Task.deleteMany();

  const user = new User(testUser);
  await user.save();
  authToken = await user.generateAuthToken();

  await new Task({ ...testTask, owner: user._id }).save();
});


afterAll(async () => {
  await mongoose.disconnect();
});

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      description: 'New test task'
    })
    .expect(201);

  // Check it was saved to DB
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toBe(false);
});

test('Should fetch user tasks', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${authToken}`)
    .send()
    .expect(200);

  expect(response.body.length).toBe(1);
  expect(response.body[0]._id).toBe(testTask._id.toHexString());
});

test('Should not delete task of other users', async () => {
  // const otherUser = new User({
  //   name: 'Other',
  //   email: 'other@example.com',
  //   password: 'pass123',
  //   tokens: [{
  //     token: jwt.sign({ _id: new mongoose.Types.ObjectId() }, process.env.JWT_SECRET || 'thisismysecret')
  //   }]
  // });

  const otherUserTest = new User(otherUser);
  await otherUserTest.save();
  otherUserAuthToken = await otherUserTest.generateAuthToken();

  await request(app)
    .delete(`/tasks/${testTask._id}`)
    .set('Authorization', `Bearer ${otherUserAuthToken}`)
    .send()
    .expect(401);

  const task = await Task.findById(testTask._id);
  expect(task).not.toBeNull();
});
