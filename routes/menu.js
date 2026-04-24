const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// herkese acik - giris gerekmez
router.get('/menu', menuController.list);
router.get('/menu/:id', menuController.detail);

module.exports = router;
