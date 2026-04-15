const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('shared/placeholder', { title: 'Caterer' });
});

module.exports = router;
