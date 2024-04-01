const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true
  },
  imageURL: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

module.exports = mongoose.model('Product', productSchema)



// const { getDb } = require('../util/database.js')
// const { ObjectId } = require('mongodb')

// class Product {
//   constructor(title, price, description, imageURL, id, userId) {
//     this.title = title
//     this.price = price
//     this.description = description
//     this.imageURL = imageURL
//     this._id = id ? new ObjectId(id) : null
//     this.userId = userId
//   }

//   save() {
//     const db = getDb()
//     let dbOp
//     if (this.id) {
//       dbOp = db
//         .collection('products')
//         .updateOne({_id: new ObjectId(this._id)}, { $set: this })
//     } else {
//       dbOp = db.collection('products').insertOne(this)
//     }
//     return dbOp
//       .then(() => {
//         console.log('Product saved')
//       })
//       .catch((e) => console.error(e))
//   }

//   static fetchAll() {
//     const db = getDb()
//     return db.collection('products')
//       .find()
//       .toArray()
//       .then((products) => {
//         return products
//       })
//       .catch((e) => console.error(e))
//   }

//   static findById(id) {
//     const db = getDb()
//     return db.collection('products')
//       .find({ _id: new ObjectId(id) })
//       .next()
//       .then((product) => {
//         return product
//       })
//       .catch((e) => console.error(e))
//   }

//   static deleteById(id) {
//     const db = getDb()
//     return db.collection('products')
//       .deleteOne({ _id: new ObjectId(id) })
//       .then((product) => {
//         return product
//       })
//       .catch((e) => console.error(e))
//   }
// }

// module.exports = Product