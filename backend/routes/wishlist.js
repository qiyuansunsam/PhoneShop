var express = require('express');
var router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.get('/', wishlistController.getWishlistItems);
router.post('/item', wishlistController.updateWishlistItem);

module.exports = router;