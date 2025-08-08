var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const phoneController = require('../controllers/phoneController')
const orderController = require('../controllers/orderController')

router.post('/', orderController.processOrder);
module.exports = router;
