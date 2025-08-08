var express = require('express');
var router = express.Router();
const phoneController = require('../controllers/phoneController');

router.get('/sold-out-soon', phoneController.getSoldOutSoonPhones);
router.get('/best-sellers', phoneController.getBestSellers);
router.get('/search', phoneController.searchItem);


module.exports = router;
