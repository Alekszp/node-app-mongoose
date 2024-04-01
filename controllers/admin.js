const { validationResult } = require('express-validator')
const Product = require('../models/product')
const mongoose = require('mongoose')
const fileHelper = require('../util/file')

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    docTitle: 'Add product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [] // field for red border for each error field on front
  })
}

exports.postAddProduct = (req, res, next) => {
  // console.log('image111')
  const { title, price, description } = req.body
  const image = req.file
  
  // let { imageURL } = req.body
  // if (!imageURL) {
  //   imageURL = 'https://cdn.pixabay.com/photo/2023/12/04/15/12/soap-8429699_1280.jpg'
  // }
  if (!image) {
    return res
      .status(422)
      .render('admin/edit-product', {
        path: '/admin/add-product',
        docTitle: 'Add product',
        editing: false,
        hasError: true,
        product: {
          title,
          price,
          description,
        },
        errorMessage: 'Attached file is not an image',
        validationErrors: [] // field for red border for each error field on front
    }) 
  }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .render('admin/edit-product', {
        path: '/admin/add-product',
        docTitle: 'Add product',
        editing: false,
        hasError: true,
        product: {
          title,
          price,
          description,
          image
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array() // field for red border for each error field on front
    })
  }

  const imageURL = image.path

  const product = new Product({ title, price, description, imageURL, userId: req.session.user })

  product
    .save()
    .then(() => {
      res.redirect('/admin/products')
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit
  if(!editMode) {
    return res.redirect('/')
  }
  const { productId } = req.params

  Product
    .findById(productId)
    .then((product) => {
      if (!product) {
        return res.redirect('/')
      }
      res.render('admin/edit-product', {
        docTitle: 'Edit product',
        path: '/admin/edit-product',
        editing: editMode,
        product,
        hasError: false,
        errorMessage: null,
        validationErrors: [] // field for red border for each error field on front
      })
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.postEditProduct = (req, res, next) => {
  const { productId, title, price, description } = req.body
  const errors = validationResult(req)
  const image = req.file
  // let { imageURL } = req.body
  // if (!imageURL) {
  //   imageURL = 'https://cdn.pixabay.com/photo/2023/12/04/15/12/soap-8429699_1280.jpg'
  // }
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .render('admin/edit-product', {
        path: '/admin/edit-product',
        docTitle: 'Edit product',
        editing: true,
        hasError: true,
        product: {
          title,
          price,
          description,
          _id: productId
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array() // field for red border for each error field on front
    })
  }
  Product
    .findById(productId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/')
      }
      product.title = title
      product.price = price
      product.description = description
      if (image) {
        fileHelper.deleteFile(product.imageURL)
        product.imageURL = image.path
      }
      
      return product.save().then(() => res.redirect('/admin/products'))
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    })
}

exports.deleteProduct = (req, res, next) => {
  const { productId } = req.params
  Product
    .findById(productId)
    .then((product) => {
      if (!product) {
        return next(new Error('product not found'))
      }
      fileHelper.deleteFile(product.imageURL)
      return Product.deleteOne({ _id: productId, userId: req.user._id })
    })
    .then(() => {
      // res.redirect('/admin/products')
      res.status(200).json({ message: 'success delete' })
    })
    .catch((e) => {
      res.status(500).json({ message: 'failed delete' })
      // const error = new Error(e)
      // error.statusCode = 500
      // return next(error)
    })
}

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price')
    // .populate('userId')
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        docTitle: 'Admin Products',
        path: '/admin/products'
      })
    })
    .catch((e) => {
      const error = new Error(e)
      error.statusCode = 500
      return next(error)
    }) 
}