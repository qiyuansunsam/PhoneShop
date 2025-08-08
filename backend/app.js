var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const connectDB = require('./db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
let authRouter = require('./routes/users')
let phoneRouter = require('./routes/phones')
let reviewRouter = require('./routes/reviews')
let profileRouter = require('./routes/profiles')
let adminRouter = require('./routes/admins')
let orderRouter = require('./routes/orders')
let cartRouter = require('./routes/carts')
let wishlistRouter = require('./routes/wishlist')

const cors = require('cors');
var app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
require('./swagger')(app);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static('public/images'));

app.use(session({
    secret: 'tut12g1',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/TUT12-G1',
        autoRemove: 'native',
        collectionName: 'sessions'
    })
}));
app.use('/auth', authRouter);
app.use('/phones', phoneRouter);
app.use('/reviews', reviewRouter);
app.use('/profiles', profileRouter);
app.use('/orders', orderRouter);
app.use('/cart', cartRouter);
app.use('/admin', adminRouter);
app.use('/wishlist', wishlistRouter)
const PORT = 8000;

(async () => {
    await connectDB();

    // Only start server after DB connection
    app.listen(PORT, () => {
        console.log('Server started on port 3000');
    });
})();

module.exports = app;
