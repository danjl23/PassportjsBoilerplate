// Require
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const app = express()

// Models
const User = require('./models/userModel')

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => console.log('MongoDB Connection Established!'))
.catch(error => console.error(`MongoDB could not be connected: ${error}`))

// reCAPTCHA
if (process.env.CAPTCHA_ENABLED == 'true') {
    console.log('reCAPTCHA Enabled. Please ensure Site & Secret Keys are correct.')
} else if (process.env.CAPTCHA_ENABLED == 'false') {
    console.log('reCAPTCHA Disabled!')
} else {
    console.error('Please set CAPTCHA_ENABLED to either true or false!')
}

// Middleware - EJS
app.set('view engine', 'ejs')

// Middleware - BodyParser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware - Session
app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    // MongoDB Session
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { maxAge: Number(process.env.EXPIRY) }
}))

// Middleware - Flash
app.use(flash())
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    // Passport Error
    res.locals.error = req.flash('error')
    next()
})

// Middleware - Passport
app.use(passport.initialize())
app.use(passport.session())

// Passport
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'pass' }, User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Global Variables
app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.session = req.session
    next()
})

// Check if Authenticated
module.exports = {
    requireAuth: function(req, res, next) {
        if(req.isAuthenticated()) {
            return next()
        }
        req.flash('error_msg', 'You are not logged in!')
        res.redirect('/login')
    }
}

// Routes
app.use(require('./routes/indexRoutes'))
app.use(require('./routes/authRoutes'))

// Listen on Port
app.listen(process.env.PORT, console.log(`Server Running on Port ${process.env.PORT}.`))