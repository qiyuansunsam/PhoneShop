
const mongoose = require("mongoose");

// phone model
const phone = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    seller: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    disabled: {
        type: Boolean,
        default: undefined,
    },
    reviews: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: undefined,
        },
        reviewer: {
            type: String,
            required: true,
        },
        rating: {
          type: Number,
          required: true,
        },

        comment: {
            type: String,
            required: true,
        },
        hidden : {
            type: String,
            default: undefined,
        }

    }],

},
        {
            timestamps: true,
            collection: 'phonelisting'
        })


module.exports =  mongoose.model('Phone', phone);