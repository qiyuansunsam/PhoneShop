var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const phoneController = require('../controllers/phoneController')
const orderController = require('../controllers/orderController')
const cartController = require('../controllers/cartController')

router.get('/', cartController.getCartItems);
router.post('/item', cartController.updateCartItem)
module.exports = router;
