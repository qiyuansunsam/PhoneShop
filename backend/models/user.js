
const mongoose = require("mongoose");

const user = new mongoose.Schema({
    email: {
        type: String,
        required: true,

    },
    password: {
        type: String,
        required: true
    },
    firstname: {
        type: String,
        required: true,

    },
    lastname: {
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
    verification: {
        type:Boolean,
        default: undefined
    },
    registerToken: {
        type: String,
        default: undefined
    },
    registerTokenExpiryDate: {
        type: Date,
        default: undefined
    },
    active: {
        type: Boolean,
        default: true
    },
    lastLogin: { 
        type: Date
    },
}, {
    collection: 'userlist'
});

module.exports =  mongoose.model('User', user);