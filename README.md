[![Build Status](https://travis-ci.com/danjl23/PassportBoilerplate.svg?branch=main)](https://travis-ci.com/danjl23/PassportBoilerplate)

# Passport.js Boilerplate
An Express App which allows users to create accounts, and login with Passport.js authentication. Accounts & Sessions are stored in MongoDB.

## To-Do List
- [ ] **Fix Issues with reCaptcha (Bug)**
- [x] Reset Password System
- [x] Store Session in MongoDB
- [x] reCAPTCHA
- [ ] Account Activation **(working on it!)**
- [ ] Change Account Details
- [ ] CSRF Protection **(working on it!)**
- [ ] Comprehensive Setup Tutorial **(working on it!)**

## Dependencies
https://www.npmjs.com/package/express  
https://www.npmjs.com/package/connect-flash  
https://www.npmjs.com/package/dotenv  
https://www.npmjs.com/package/ejs  
https://www.npmjs.com/package/express-session  
https://www.npmjs.com/package/mongoose  
https://www.npmjs.com/package/connect-mongo  
https://www.npmjs.com/package/nodemailer  
https://www.npmjs.com/package/passport  
https://www.npmjs.com/package/passport-local  
https://www.npmjs.com/package/passport-local-mongoose  
https://www.npmjs.com/package/express-recaptcha  

## Configuration
```sh
$ cp .env.template .env
```
### Example:
```
# Server Port
PORT = 3000

# MongoDB Connection String
MONGO_URI = 'mongodb+srv://example:abc123@cluster.tgr8u.mongodb.net/users?retryWrites=true&w=majority'

# Session (Expiry in Milliseconds)
SECRET = 'sessionsecret'
EXPIRY = 1800000

# Email Settings
SMTP_HOST = 'smtp.mailtrap.io'
SMTP_PORT = 2525
SMTP_USER = 'yourusername'
SMTP_PASS = 'yourpassword'
SMTP_FROM = 'email@example.com'

# reCAPTCHA (v2 Checkbox)
CAPTCHA_ENABLED = true
SITE_KEY = 'Get from https://www.google.com/recaptcha/admin'
SECRET_KEY = 'Get from https://www.google.com/recaptcha/admin'
```  
## Usage
```sh
$ npm i
```
```sh
$ npm run dev
# OR
$ npm run start
```
