const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user');

const userId = new mongoose.Types.ObjectId();
const testUser = {
  _id: userId,
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'MyPass777!',
  tokens: [{
    token: jwt.sign({ _id: userId }, process.env.JWT_SECRET)
  }]
};

const setupDatabase = async () => {
  await User.deleteMany();
  await new User(testUser).save();
};

module.exports = {
  testUser,
  setupDatabase
};
