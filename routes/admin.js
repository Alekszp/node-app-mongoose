const path = require('path')
const express = require('express')
const adminController = require('../controllers/admin')
const isAuth = require('../middleware/isAuth.js')

const { createEditValidations } = require('../util/createEditValidations')

const router = express.Router()

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct)

// // /admin/products => GET
router.get('/products', isAuth, adminController.getProducts)

// /admin/add-product => POST
router.post('/add-product', createEditValidations, isAuth, adminController.postAddProduct)

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct)

router.post('/edit-product', createEditValidations, isAuth, adminController.postEditProduct)

router.delete('/product/:productId', isAuth, adminController.deleteProduct)

module.exports = router