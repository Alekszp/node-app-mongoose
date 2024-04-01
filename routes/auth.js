const express = require('express')
// const { check, body } = require('express-validator')
const router = express.Router()
const authController = require('../controllers/auth')
const { signupValidations } = require('../util/signupValidations')
const { loginValidations } = require('../util/loginValidations')

router.get('/login', authController.getLogin)
router.get('/signup', authController.getSignup)
router.get('/reset-password', authController.getReset)
router.get('/reset/:token', authController.getNewPassword)

router.post('/login', loginValidations, authController.postLogin)
router.post('/logout', authController.postLogout)
router.post('/signup', signupValidations, authController.postSignup)
router.post('/reset-password', authController.postReset)
router.post('/new-password', authController.postNewPassword)

module.exports = router