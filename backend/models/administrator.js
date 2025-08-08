
const mongoose = require("mongoose");

const administrator = new mongoose.Schema({
    email: {
        type: String,
        required: true,

    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,

    },
    token: {
        type: String,
        default: undefined
    },
    expiryDate: {
        type: Date,
        default: undefined
    },
}, {
    collection: 'administratorlist'
});

module.exports =  mongoose.model('Administrator', administrator);