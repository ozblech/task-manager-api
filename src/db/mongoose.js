const mongoose = require('mongoose')

const connectToDB = async () => {
    const dbUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/test";
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  };

const disconnectFromDB = async () => {
await mongoose.disconnect();
};
  
module.exports = { connectToDB, disconnectFromDB };


