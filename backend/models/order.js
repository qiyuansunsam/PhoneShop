const mongoose = require("mongoose");

// order model
const order = new mongoose.Schema({
        totalNumber: {
            type: Number,
            required: true
        },
        totalPrice: {
          type: Number,
          required: true
        },
        buyer: {
            type: String,
            required: true
        },
        products: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            number: {
                type: Number,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
        }],

    },
    {
        timestamps: true,
        collection: 'orders'
    })


module.exports =  mongoose.model('Order', order);