const express = require('express');
const router = express.Router();
const catererController = require('../controllers/catererController');

router.get('/', (req, res) => {
  res.redirect('/caterer/dashboard');
});

router.get('/dashboard', catererController.dashboard);

module.exports = router;
