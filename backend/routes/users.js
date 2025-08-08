var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');


router.post('/login', userController.login);
router.post('/register', userController.signup);
router.post('/logout', userController.logout);
router.post('/request-reset',userController.requestResetPassword);
router.post('/reset-password', userController.resetPassword);
router.get('/register-confirm', userController.registerConfirmation);
router.get('/status', userController.getUserStatus);
router.post('/username', userController.getUserNameById);


module.exports = router;
