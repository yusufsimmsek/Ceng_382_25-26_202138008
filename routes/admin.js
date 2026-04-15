const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('shared/placeholder', { title: 'Admin' });
});

module.exports = router;
