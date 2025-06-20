const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')
const cors = require('cors')


const router = new express.Router()
router.all('*', cors())

//
router.get('/' , async (req, res) => {
    res.status(201).send('It is working')
})

// Simulated complex request with HTTP metrics
router.get('/simulate-complex', async (req, res) => {
  const { httpRequestDurationMicroseconds } = req.app.locals.metrics;
  const end = httpRequestDurationMicroseconds.startTimer();
  const route = '/simulate-complex';

  try {
    // Simulate a slow operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000)); // 0-2 sec

    res.status(200).send('Complex request completed');
  } catch (e) {
    res.status(500).send('Error');
  } finally {
    end({ route, method: req.method, status_code: res.statusCode });
  }
});


//create user
router.post('/users' , async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)

        // Increment Prometheus metric
        const { userCreationCounter } = req.app.locals.metrics;
        userCreationCounter.inc();
        

        const token = await user.generateAuthToken()
        res.status(201).json({ user, token })
    }
    catch (e) {
        console.error('User creation failed:', e);
        res.status(400).json(e);
    }
})

//login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
})

//logoout
router.post('/users/logout', auth, async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return (token.token !== req.token)
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//logout all
router.post('/users/logoutAll', auth, async (req,res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

//view profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})



router.patch('/users/me', auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!'})
    }

    try {
        const user = req.user
        updates.forEach((update) => user[update] = req.body[update])   
        await user.save()
        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true})
        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

//cancel
router.delete('/users/me', auth, async (req, res) => {
    const _id = req.user._id

    try {
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('please upload only files of type jpeg/jpg/png'))
        }

        return cb(undefined,true)
    }
})


//upload avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => {
    const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250 }).toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//get avatar image on browser
router.get('/users/:id/avatar', async(req,res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})


module.exports = router
