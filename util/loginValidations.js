const { check, body } = require('express-validator')
const User = require('../models/user')

exports.loginValidations = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password', 'Password has to be valid')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
]