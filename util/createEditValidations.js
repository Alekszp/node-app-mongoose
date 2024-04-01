const { body } = require('express-validator')

exports.createEditValidations = [
  body('title', 'Title have to be min 5 a-Z 0-9 symbols')
    .isLength({ min: 5 })
    .isString()
    .trim(),
  body('price', 'Please enter a price with only numbers')
    .isFloat()
    .trim(),
  body('description', 'Description have to be min 5 symbols')
    .isLength({ min: 5 })
    .trim()
]