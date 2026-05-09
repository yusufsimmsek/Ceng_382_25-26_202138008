const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.dashboard);
router.get('/dashboard', adminController.dashboard);
router.get('/users', adminController.usersList);
router.get('/caterers', adminController.caterersList);
router.get('/orders', adminController.ordersList);
router.get('/logs', adminController.logsList);

module.exports = router;
