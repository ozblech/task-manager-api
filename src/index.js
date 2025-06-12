require('dotenv').config();
console.log('MONGODB_URL:', process.env.MONGODB_URL);
const express = require('express')
const { connectToDB } = require('./db/mongoose');
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')    
const cors = require('cors')
const promClient = require('prom-client');

const app = express()
const port = process.env.PORT || 3000

// Enable default metrics collection
promClient.collectDefaultMetrics();

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5] // duration buckets in seconds
});

// Define a custom counter for created users
const userCreationCounter = new promClient.Counter({
  name: 'user_creation_total',
  help: 'Total number of users created'
});

// Make the counter accessible to your routers
app.locals.metrics = {
  userCreationCounter,
  httpRequestDurationMicroseconds
};

// Metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});



const multer = require('multer')
const upload = multer({
    dest: 'images',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(doc|docx)$/)) {
            return cb(new Error('Please upload a word document'))
        }
        
        return cb(undefined,true)
    }
})
app.post('/upload', upload.single('upload'), (req,res) => {
    res.send()
})


app.use(cors())
app.use(express.json())
// ✅ Add health check endpoint here
app.get('/health', (req, res) => {
    res.send('OK');
  });
app.use(userRouter)
app.use(taskRouter)


let server;

if (require.main === module) {
  connectToDB()
  .then(() => {
    server = app.listen(port, () => {
      console.log('Server is up on port ' + port);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Fail fast
  });
}


module.exports = app;
