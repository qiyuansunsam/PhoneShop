const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.get('/logout', adminController.logout);
router.get('/status', adminController.checkAdminSession);
router.get('/users', adminController.fetchUsers);
router.patch('/users/:userId', adminController.updateUserDetails);
router.patch('/users/:userId/disable', adminController.disableUser);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/users/:userId/details', adminController.getUserListingsAndReviews);
router.get('/sales', adminController.fetchSalesLogs)
router.get('/sales/export', adminController.exportSalesHistory)
router.get('/listings', adminController.fetchAllListings);
router.patch('/listings/:listingId', adminController.updateListingDetails);
router.patch('/listings/:listingId/disable', adminController.disableListing);
router.delete('/listings/:listingId', adminController.deleteListingAdmin);
router.get('/listings/:listingId/details', adminController.getListingReviewsAndSeller);
router.get('/reviews', adminController.fetchAllReviews);
router.patch('/reviews/:listingId/visibility', adminController.toggleReviewVisibilityAdmin);
module.exports = router;