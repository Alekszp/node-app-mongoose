const Product = require('../models/product')
const Order = require('../models/order')
const User = require('../models/user')
const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const stripe = require('stripe')(process.env.STRIPE_KEY)

const ITEMS_PER_PAGE = 2

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems

  Product
    .find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts
      return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
    })  
    .then((response) => {
      res.render('shop/product-list', {
        prods: response,
        docTitle: 'All products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviosPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      })
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.getProduct = (req, res, next) => {
  const { productId } = req.params
  
  Product.findById(productId)
  .then((product) => {
    res.render('shop/product-detail', {
      product: product,
      docTitle: product.title,
      path: '/products',
    })
  })
  .catch((e) => {
    const error = new Error(e)
    error.statusCode = 500
    return next(error)
  }) 
}

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems

  Product
    .find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts
      return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
    })  
    .then((response) => {
      res.render('shop/index', {
        prods: response,
        docTitle: 'Shop',
        path: '/',
        csrfToken: req.csrfToken(),
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviosPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      })
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.getCart = (req, res, next) => {
  // User.findById(req.user._id)
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then((user) => {
    res.render('shop/cart', {
      path: '/cart',
      docTitle: 'Your Cart',
      cartProducts: user.cart.items,
    })
  })
  .catch((e) => {
    const error = new Error(e)
    error.statusCode = 500
    return next(error)
  })
}

exports.postCart = (req, res, next) => {
  const { productId } = req.body
  Product
    .findById(productId)
    .then((product) => {
      return req.user.addToCart(product)
    })
    .then(() => {
      res.redirect('/cart')
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.postDeleteCartItem = (req, res, next) => {
  const { productId } = req.body
  req.user
    .removeFromCart(productId)    
    .then(() => {
      res.redirect('/cart')    
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.getCheckout = (req, res, next) => {
  let products
  let totalSum = 0
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then((user) => {
    products = user.cart.items
    products.forEach((product) => {
      totalSum += product.qty * product.productId.price
    })

    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map((p) => {
        return {
          price_data: {
            currency: 'usd',
            unit_amount: p.productId.price * 100,
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
          },
          quantity: p.qty
        }
      }),
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
      cancel_url:  `${req.protocol}://${req.get('host')}/checkout/cancel`
    })    
  })
  .then((session) => {
    res.render('shop/checkout', {
      path: '/checkout',
      docTitle: 'Checkout',
      cartProducts: products,
      totalSum,
      sessionId: session.id
    })
  })
  .catch((e) => {
    const error = new Error(e)
    error.statusCode = 500
    return next(error)
  })
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.qty,
          product: { ...i.productId._doc }
        }
      })
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products
      })
      return order.save()
    })
    .then(() => {
      return req.user.clearCart()
    })
    .then(() => {
      res.redirect('/orders')
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.qty,
          product: { ...i.productId._doc }
        }
      })
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products
      })
      return order.save()
    })
    .then(() => {
      return req.user.clearCart()
    })
    .then(() => {
      res.redirect('/orders')
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
  .then((orders) => {
    res.render('shop/orders', {
      path: '/orders',
      docTitle: 'Your Orders',
      orders: orders,
    })
  })
  .catch((e) => {
    const error = new Error(e)
    error.statusCode = 500
    return next(error)
  })
  
}

exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params
  Order
    .findById(orderId)
    .then((order) => {
      if (!order) {
        return new Error('No order found')
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthirized'))
      }
      const invoiceName = `Invoice-${orderId}.pdf`
      const invoicePath = path.join('data', 'invoices', invoiceName)

      const pdfDoc = new PDFDocument()
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="'${invoiceName}'"`)
      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      pdfDoc.pipe(res)
      pdfDoc.fontSize(22).text(`Invoice-${orderId}`)
      pdfDoc.fontSize(16).text('____________')
      pdfDoc.text(' ')
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice = totalPrice + prod.quantity * prod.product.price
        pdfDoc.text(`Title: ${prod.product.title}`)
        pdfDoc.text(`Quantity: ${prod.quantity}`)
        pdfDoc.text(`Price: $${prod.product.price}`)
        pdfDoc.text(' ')
      })
      pdfDoc.text('____________')
      pdfDoc.text(`Total price: $${totalPrice}`)
      
      pdfDoc.end()
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err)
      //   }
      //   res.setHeader('Content-Type', 'application/pdf')
      //   res.setHeader('Content-Disposition', `inline; filename="'${invoiceName}'"`)
      //   res.send(data)
      // })
      // const file = fs.createReadStream(invoicePath)
      // res.setHeader('Content-Type', 'application/pdf')
      // res.setHeader('Content-Disposition', `inline; filename="'${invoiceName}'"`)
      // file.pipe(res)
    })
    .catch((e) => next(e))
}

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     docTitle: 'Checkout'
//   })
// }