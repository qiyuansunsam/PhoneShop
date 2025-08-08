var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const phoneController = require('../controllers/phoneController')
const uploadImage = require('../config/multerConfig')


router.patch('/', userController.updateProfile);
router.get('/listings', phoneController.getAllListings);
router.post('/listings/addListing',uploadImage, phoneController.addListing)
router.put('/listings/:listingId', uploadImage, phoneController.updateListing)
router.patch('/listings/:listingId/status', phoneController.toggleListingStatus)
router.delete('/listings/:listingId', phoneController.deleteListing)
router.post('/password', userController.changePassword)



module.exports = router;
