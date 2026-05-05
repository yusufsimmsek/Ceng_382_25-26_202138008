const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.dashboard);
router.get('/dashboard', userController.dashboard);

router.get('/profile', userController.profile);
router.post('/profile/location', userController.updateLocation);
router.post('/profile/address', userController.updateAddress);

module.exports = router;
