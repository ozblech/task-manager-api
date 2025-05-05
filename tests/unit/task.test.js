const request = require('supertest');
const app = require('../../src/index');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');
const { connectToDB, disconnectFromDB } = require('../../src/db/mongoose');

let token;
let testUser;
let otherUser;
let otherUserToken;

beforeAll(async () => {
  await connectToDB();

  testUser = new User({
    name: 'Task Tester',
    email: 'tasktester@example.com',
    password: 'MyPass777!'
  });

  token = await testUser.generateAuthToken();
  await testUser.save();

  // Create other test users
  otherUser = new User({
    name: 'Other User',
    email: 'otherUser@example.com',
    password: 'MyPass7772'
  });
  
  otherUserToken = await otherUser.generateAuthToken();
  await otherUser.save();
});


afterEach(async () => {
  await Task.deleteMany();
});

afterAll(async () => {
  await User.deleteMany();
  await disconnectFromDB();
});

test('Should create a task for authenticated user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      description: 'Test task'
    })
    .expect(201);

  // Check DB entry
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.description).toBe('Test task');
  expect(task.owner.toString()).toBe(testUser._id.toString());
});

test('Should fetch user tasks', async () => {
  await Task.create([
    { description: 'Task 1', owner: testUser._id },
    { description: 'Task 2', owner: testUser._id }
  ]);

  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(response.body.length).toBe(2);
});

test('Should not fetch user tasks from another user', async () => {
  await Task.create({
    description: 'Task from another user',
    owner: otherUser._id
  });

  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(response.body.length).toBe(0);
});
