const mongoose = require("mongoose");

// Wishlist model
const wishlist = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Phone',
        required: true
    }]
}, {
    timestamps: true,
    collection: 'wishlists'
});

module.exports = mongoose.model('Wishlist', wishlist);
