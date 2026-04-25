const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', (req, res) => {
  res.render('shared/placeholder', { title: 'Kullanıcı' });
});

router.get('/profile', userController.profile);
router.post('/profile/location', userController.updateLocation);
router.post('/profile/address', userController.updateAddress);

module.exports = router;
