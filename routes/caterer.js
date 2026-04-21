const express = require('express');
const router = express.Router();
const catererController = require('../controllers/catererController');
const upload = require('../middleware/upload');

router.get('/', (req, res) => {
  res.redirect('/caterer/dashboard');
});

router.get('/dashboard', catererController.dashboard);

// menu yonetimi
router.get('/menu', catererController.menuList);
router.get('/menu/new', catererController.menuNewForm);
router.post('/menu', upload.single('image'), catererController.menuCreate);
router.get('/menu/:id/edit', catererController.menuEditForm);
router.put('/menu/:id', upload.single('image'), catererController.menuUpdate);
router.delete('/menu/:id', catererController.menuDelete);

module.exports = router;
