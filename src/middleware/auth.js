const jwt = require('jsonwebtoken')
const User = require('../models/user')


const auth = async (req,res,next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        console.log('Token received:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log('Decoded JWT:', decoded);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        console.log('User found:', user); // This might be null
        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch(e) {
        console.log('Auth error:', e.message);
        res.status(401).send({ error: 'Please authenticate!.' })
    }
}

module.exports = auth
