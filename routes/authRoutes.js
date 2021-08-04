// Require
const express = require('express')
const passport = require('passport')
const crypto = require('crypto')
const async = require('async')
const nodemailer = require('nodemailer')
const Recaptcha = require('express-recaptcha').RecaptchaV2

const router = express.Router()

// Models
const User = require('../models/userModel')

// Check if Authenticated
const { requireAuth } = require('../app')

// reCAPTCHA
const recaptcha = new Recaptcha(process.env.SITE_KEY, process.env.SECRET_KEY, { callback: 'cb' })
const captchaVerify = (req, res, next) => {
    if (process.env.CAPTCHA_ENABLED == 'true' && req.recaptcha.error) {
        req.flash('error_msg', 'reCAPTCHA Incorrect!')
        res.redirect('back')
    } else {
        return next()
    }
}

// Login Routes
router.get('/login', recaptcha.middleware.render, (req, res) => res.render('login', { captcha: res.recaptcha }))
router.post('/login', recaptcha.middleware.verify, captchaVerify, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Incorrect Email or Password!'
}))

// Register Routes
router.get('/register', recaptcha.middleware.render, (req, res) => res.render('register', { captcha: res.recaptcha }))
router.post('/register', recaptcha.middleware.verify, captchaVerify, (req, res) => {
    const { name, email, pass, pass2 } = req.body

    // Field Validation
    let errors = []
    if (!name || !email || !pass || !pass2) {
        errors.push({msg: 'Please fill all fields!'})
    }
    if (pass != pass2) {
        errors.push({msg: 'Passwords do not match.'})
    }
    if (pass.length < 6) {
        errors.push({msg: 'Password must be at least 6 characters.'})
    }
    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email
        })
    } else {
        // Check for Existing Email
        User.findOne({ email: email })
        .then(user => {
            if(user) {
                // User Already Exists
                errors.push({msg: 'An account with that email already exists!'})
                res.render('register', {
                    errors,
                    name,
                    email
                })
            }
        })
        // Register User
        User.register({
            // Setting Data
            name: name,
            email: email,
            ip: req.headers['x-forwarded-for'] || req.ip
        }, pass, (error, user) => {
            if(error) {
                req.flash('error_msg', 'An error occured. Please try again.')
                res.redirect('/register')
            }
            passport.authenticate('local') (req, res, () => {
                req.flash('success_msg', 'Registration successful!')
                res.redirect('/login')
            })
        })
    }
})

// Reset Password Routes
router.get('/reset', recaptcha.middleware.render, (req, res) => res.render('reset', { captcha: res.recaptcha }))
router.post('/reset', recaptcha.middleware.verify, captchaVerify, (req, res, next) => {
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (error, buffer) => {
                let token = buffer.toString('hex')
                done(error, token)
            })
        }, (token, done) => {
            User.findOne({ email: req.body.email })
            .then(user => {
                if(!user) {
                    // User Not Found
                    req.flash('error_msg', 'Account does not exist!')
                    return res.redirect('/reset')
                }
                user.token = token
                user.tokenExpires = Date.now() + 1800000 // 30 Minutes
                // Saving Token & Token Expiry to Database
                user.save(error => {
                    done(error, token, user)
                })
            })
            .catch(error => {
                req.flash('error_msg', 'An error occured. Please try again.')
                res.redirect('/reset')
            })
        }, (token, user) => {
            let transport = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            })
            let options = {
                to: user.email,
                from: process.env.SMTP_FROM,
                subject: 'Reset Password',
                text: `Please click the link below to reset your password.\n\nhttp://${req.headers.host}/reset/${token}`
            }
            // Sending Email
            transport.sendMail(options, error => {
                req.flash('success_msg', 'Please check your email inbox for instructions.')
                res.redirect('/login')
            })
        }
    ], error => {
        if(error) throw error
    })
})

router.get('/reset/:token', recaptcha.middleware.render, (req, res) => {
    User.findOne({ token: req.params.token, tokenExpires: {$gt: Date.now()} })
    .then(user => {
        if(!user) {
            // Token Expired or Not Found
            req.flash('error_msg', 'Token invalid!')
            res.redirect('/reset')
        }
        res.render('newpassword', { token: req.params.token, captcha: res.recaptcha })
    })
    .catch(error => {
        req.flash('error_msg', 'An error occured. Please try again.')
        res.redirect('/reset')
    })
})
router.post('/reset/:token', recaptcha.middleware.verify, captchaVerify, (req, res) => {
    async.waterfall([
        (done) => {
            User.findOne({ token: req.params.token, tokenExpires: {$gt: Date.now()}})
            .then(user => {
                if(!user) {
                    // Token Expired or Not Found
                    req.flash('error_msg', 'Token invalid!')
                    res.redirect('/reset')
                }
                // Field Validation
                if(req.body.pass !== req.body.pass2) {
                    req.flash('error_msg', 'Passwords do not match.')
                    return res.redirect('back')
                }
                if(req.body.pass.length < 6) {
                    req.flash('error_msg', 'Password must be at least 6 characters.')
                    return res.redirect('back')
                }

                // Change Password & Clear Token from Database
                user.setPassword(req.body.pass, error => {
                    user.token = undefined
                    user.tokenExpires = undefined
                    user.save(error => {
                        req.login(user, error => {
                            done(error, user)
                        })
                    })
                })
            })
            .catch(error => {
                req.flash('error_msg', 'An error occured. Please try again.')
                res.redirect('/reset')
            })
        },
        (user) => {
            let transport = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            })
            let options = {
                to: user.email,
                from: process.env.SMTP_FROM,
                subject: 'Password Changed',
                text: 'Your password has been changed!'
            }
            // Sending Email
            transport.sendMail(options, error => {
                req.flash('success_msg', 'Password changed succesfully!')
                res.redirect('/login')
            })
        }
    ], error => {
        if(error) throw error
    })
})

// Logout Routes
router.get('/logout', requireAuth, (req, res) => {
    req.logout()
    req.flash('success_msg', 'You are logged out.')
    res.redirect('/login')
})

// Export Router
module.exports = router
