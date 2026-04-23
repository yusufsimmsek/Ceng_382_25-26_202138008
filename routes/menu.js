const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// herkese acik - giris gerekmez
router.get('/menu', menuController.list);

module.exports = router;
