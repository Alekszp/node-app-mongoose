const path = require('path')
const express = require('express')
const shopController = require('../controllers/shop')
const isAuth = require('../middleware/isAuth.js')

const router = express.Router()

router.get('/', shopController.getIndex)

router.get('/products', shopController.getProducts)

router.get('/products/:productId', shopController.getProduct)

router.get('/cart', isAuth, shopController.getCart)

router.post('/cart', isAuth, shopController.postCart)

router.get('/orders', isAuth, shopController.getOrders)

router.post('/cart-delete-item', isAuth, shopController.postDeleteCartItem)

router.get('/checkout', isAuth, shopController.getCheckout)

router.get('/checkout/success', shopController.getCheckoutSuccess)

router.get('/checkout/cancel', shopController.getCheckout)

// router.post('/create-order', isAuth, shopController.postOrder)

router.get('/orders/:orderId', isAuth, shopController.getInvoice)

module.exports = router