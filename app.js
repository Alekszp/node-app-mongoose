const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoBDStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')
const flash = require('connect-flash')
const multer = require('multer')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const fs = require('fs')
const https = require('https')

const User = require('./models/user.js')

const errorController = require('./controllers/error.js')

const adminRoutes = require('./routes/admin.js')
const shopRoutes = require('./routes/shop.js')
const authRoutes = require('./routes/auth.js')

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ojolusr.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`

const app = express()

const store = new MongoBDStore({
  uri: MONGODB_URI,
  collection: 'sessions'
})

const csrfProtection = csrf()
// const privateKey = fs.readFileSync('server.key')
// const certificate = fs.readFileSync('server.cert')

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})
const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.set('view engine', 'ejs')
app.set('views', 'views')

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' } )

app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: accessLogStream }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(multer({ storage: fileStorage, fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(session({
  secret: 'my super secret string',
  store,
  resave: false,
  saveUninitialized: false,
}))

// should be after initialize the session
app.use(csrfProtection)
app.use(flash())

app.use((req, res, next) => {
  if(!req.session.user) {
    return next()
  }
  User
    .findById(req.session.user._id)
    .then((user) => {
      if(!user) {
        return next()
      }
      req.user = user
      next()
    })
    .catch((e) => {
      next(new Error(e))
    })
})

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', errorController.get500)
app.use(errorController.get404)
app.use((error, req, res, next) => {
  res.status(500).render('500', {
    docTitle: '500 Error!',
    path: '/500',
    errorMessage: 'Some technical issues occured! Please try later',
    isAuthenticated: req.session.isLoggedIn
  })
})

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000)
    app.listen(process.env.PORT || 3000)
  })
  .catch(e => console.log(e))