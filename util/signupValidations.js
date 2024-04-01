const { check, body } = require('express-validator')
const User = require('../models/user')

exports.signupValidations = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, { req }) => {
      return User.findOne({ email: value })
        .then((userData) => {
          if (userData) {
            return Promise.reject('Email exists already')
          }
        })
    })
    .normalizeEmail(),
  body('password', 'Please enter a password with only numbers and text and at least 5 characters')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  body('confirmPassword')
    .trim()  
    .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match')
        }
        return true
      })
]