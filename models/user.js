const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: {
    type: String
  },
  resetTokenExpiration: {
    type: Date
  },
  cart: {
    items: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      qty: {
        type: Number,
        required: true
      } 
    }]
  }
})

userSchema.methods.addToCart = function (product) {  
  const cartProductIndex = this.cart.items.findIndex((i) => {
    return i.productId.toString() === product._id.toString()
  })
  
  const updatedCartItems = [...this.cart.items]
  
  if (cartProductIndex >= 0) {
    updatedCartItems[cartProductIndex].qty++
  } else {
    updatedCartItems.push({ productId: product._id, qty: 1 })
  }

  this.cart = {
    items: updatedCartItems
  }

  return this.save()  
}

userSchema.methods.removeFromCart = function(productId) {
  this.cart.items = this.cart.items.filter((i) => i.productId.toString() !== productId.toString())
  return this.save()
}

userSchema.methods.clearCart = function() {
  this.cart = { items: []}
  return this.save()
}

module.exports = mongoose.model('User', userSchema)


// const { getDb } = require('../util/database')
// const { ObjectId } = require('mongodb')

// class User {
//   constructor(name, email, cart, id) {
//     this.name = name
//     this.email = email
//     this.cart = cart
//     this._id = id
//   }

//   save() {
//     const db = getDb()
//     let dbOp
//     if(this._id) {
//       dbOp = db
//         .collection('users')
//         .updateOne({ _id: new ObjectId(this._id) }, { $set: this })
//     } else {
//       dbOp = db
//         .collection('users')
//         .insertOne(this)
//     }
//     return dbOp
//       .then(() => {
//         console.log('User saved')
//       })
//       .catch((e) => console.error(e))
//   }

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex((i) => {
//       return i.productId.toString() === product._id.toString()
//     })
    
//     const updatedCartItems = [...this.cart.items]
    
//     if (cartProductIndex >= 0) {
//       updatedCartItems[cartProductIndex].qty++
//     } else {
//       updatedCartItems.push({ productId: new ObjectId(product._id), qty: 1 })
//     }

//     const updatedCart = {
//       items: updatedCartItems
//     }

//     const db = getDb()
//     return db
//       .collection('users')
//       .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: updatedCart } })    
//   }

//   getCart() {
//     const db = getDb()
//     const productIds = this.cart.items.map(i => i.productId)
//     return db
//       .collection('products')
//       .find({ _id: {$in: productIds} })
//       .toArray()
//       .then((products) => {
//         return products.map(i => {
//           return { ...i, qty: this.cart.items.find(k => k.productId.toString() === i._id.toString()).qty }
//         })
//       })
//   }

//   deleteItemFromCart(productId) {
//     const updatedCart = this.cart.items.filter((i) => i.productId.toString() !== productId.toString())
//     const db = getDb()
//     return db
//       .collection('users')
//       .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: updatedCart } })
//   }

//   addOrder() {
//     const db = getDb()
//     return this.getCart()
//       .then((products) => {
//         const order = {
//           items: products,
//           user: {
//             _id: new ObjectId(this._id),
//             name: this.name,
//             email: this.email
//           }
//         }
//         return db.collection('orders').insertOne(order)
//       })
//       .then(() => {
//         this.cart = { items: [] }
//         return db
//           .collection('users')
//           .updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: this.cart } })
//       })
//   }

//   getOrders() {
//     const db = getDb()
//     return db
//       .collection('orders')
//       .find({ 'user._id': new ObjectId(this._id) })
//       .toArray()
//       .then((orders) => {
//         return orders
//       })
//   }

//   static findById(id) {
//     const db = getDb()
//     return db
//       .collection('users')
//       .findOne({ _id: new ObjectId(id) })
//       .then((user) => {
//         return user
//       })
//       .catch((e) => console.error(e))
//   }
// }

// module.exports = User