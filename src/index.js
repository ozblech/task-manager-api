require('dotenv').config();
console.log('MONGODB_URL:', process.env.MONGODB_URL);
const express = require('express')
const { connectToDB } = require('./db/mongoose');
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')    
const cors = require('cors')



const app = express()
const port = process.env.PORT || 3000

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





