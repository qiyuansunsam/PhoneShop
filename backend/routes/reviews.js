var express = require('express');
var router = express.Router();
const phoneController = require('../controllers/phoneController');
router.post('/', phoneController.postReview);
router.get('/getUserReview', phoneController.getReviewByUserId)
router.patch('/:phoneId/visibility', phoneController.toggleReviewVisibility);

module.exports = router;
