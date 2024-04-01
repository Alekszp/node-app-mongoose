const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "36bf4694453a87",
    pass: "311860fe2e491f",
  },
})

const User = require('../models/user')

exports.getLogin = (req, res, next) => {
  let errorMessage = req.flash('error')
  if (errorMessage.length) {
    errorMessage = errorMessage[0]
  } else {
    errorMessage = null
  }
  res.render('auth/login', {
    path: '/login',
    docTitle: 'Login',
    errorMessage,
    oldData: {
      email: '',
      password: ''
    },
    validationErrors: []
  })
}

exports.getSignup = (req, res, next) => {
  let errorMessage = req.flash('error')
  if (errorMessage.length) {
    errorMessage = errorMessage[0]
  } else {
    errorMessage = null
  }
  res.render('auth/signup', {
    path: '/signup',
    docTitle: 'Signup',
    errorMessage,
    oldData: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  })
}

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body
  const errors = validationResult(req)

  if(!errors.isEmpty()) {
    return res
      .status(422)
      .render('auth/login', {
        path: '/login',
        docTitle: 'Login',
        errorMessage: errors.array()[0].msg,
        oldData: {
          email,
          password
        }
      })
  }

  User
    .findOne({ email })
    .then((user) => {
      if (!user) {
        return res
          .status(422)
          .render('auth/login', {
            path: '/login',
            docTitle: 'Login',
            errorMessage: 'Invalid email or password',
            oldData: {
              email,
              password
            },
            validationErrors: []
      })
      }
      bcrypt
        .compare(password, user.password)
        .then((isPasswordsEqual) => {
          if (isPasswordsEqual) {
            req.session.isLoggedIn = true
            req.session.user = user
            return req.session.save(() => {
              res.redirect('/')
            })
          }
          return res
            .status(422)
            .render('auth/login', {
              path: '/login',
              docTitle: 'Login',
              errorMessage: 'Invalid email or password',
              oldData: {
                email,
                password
              },
              validationErrors: []
            })
        })
        .catch((e) => {
          console.error(e)
          res.redirect('/login')
        })
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body  
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .render('auth/signup', {
        path: '/signup',
        docTitle: 'Signup',
        errorMessage: errors.array()[0].msg,
        oldData: {
          email,
          password,
          confirmPassword
        }
    })
  }
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        cart: {
          items: []
        }
      })
      return user.save()
    })
    .then(() => {
      return transporter
        .sendMail({
          from: 'node-app',
          to: email,
          subject: "You successfully Signed Up",
          html: "<b>Wellcom to the SHOP</b>",
        })
    })
    .then(() => {
      res.redirect('/login')
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.postLogout = (req, res, next) => {
  req.session
    .destroy((e) => {
      console.error(e)
      res.redirect('/')
    })
}

exports.getReset = (req, res, next) => {
  let errorMessage = req.flash('error')
  if (errorMessage.length) {
    errorMessage = errorMessage[0]
  } else {
    errorMessage = null
  }
  res.render('auth/reset-password', {
    path: '/reset-password',
    docTitle: 'Reset password',
    errorMessage
  })
}

exports.postReset = (req, res, next) => {
  let errorMessage = req.flash('error')
  if (errorMessage.length) {
    errorMessage = errorMessage[0]
  } else {
    errorMessage = null
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset-password')
    }
    const token = buffer.toString('hex')
    const {
      email
    } = req.body
    User
      .findOne({
        email
      })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email found')
          return res.redirect('/reset-password')
        }
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 60 * 60 * 1000 // 1h
        return user.save()
      })
      .then((res) => {
        return transporter
          .sendMail({
            from: 'node-app',
            to: email,
            subject: "Password reset",
            html: `
              <h2>You requested a password reset</h2>
              <p>Click this <a href="http://localhost:3000/reset/${token}" target="_blank">link</a> to set a new password</p>
            `
          })
      })
      .then(() => {
        res.redirect('/')
      })
      .catch((e) => {
        const error = new Error(e)
        error.statusCode = 500
        return next(error)
      })
  })
}

exports.getNewPassword = (req, res, next) => {

  const {
    token
  } = req.params
  User
    .findOne({
      resetToken: token,
      resetTokenExpiration: {
        $gt: Date.now()
      }
    })
    .then((user) => {
      let errorMessage = req.flash('error')
      if (errorMessage.length) {
        errorMessage = errorMessage[0]
      } else {
        errorMessage = null
      }

      res.render('auth/new-password', {
        path: '/new-password',
        docTitle: 'New password',
        errorMessage,
        userId: user._id.toString(),
        passwordToken: token
      })
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.postNewPassword = (req, res, next) => {
  const {
    password,
    userId,
    passwordToken
  } = req.body

  let resetUser

  User
    .findOne({
      resetToken: passwordToken,
      resetTokenExpiration: {
        $gt: Date.now()
      },
      _id: userId
    })
    .then((user) => {
      resetUser = user
      return bcrypt.hash(password, 12)
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword
      resetUser.resetToken = null
      resetUser.resetTokenExpiration = undefined

      return resetUser.save()
    })
    .then(() => {
      res.redirect('/login')
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}