const mongoose = require("mongoose");

// cart model
const cart = new mongoose.Schema({
        customer: {
            type: String,
            required: true
        },
        products: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            quantity: {
                type: Number,
                required: true
            }
        }],

    },
    {
        timestamps: true,
        collection: 'carts'
    })


module.exports =  mongoose.model('Cart', cart);