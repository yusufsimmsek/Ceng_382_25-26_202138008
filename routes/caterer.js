const express = require('express');
const router = express.Router();
const catererController = require('../controllers/catererController');
const upload = require('../middleware/upload');

router.get('/', (req, res) => {
  res.redirect('/caterer/dashboard');
});

router.get('/dashboard', catererController.dashboard);

router.get('/profile', catererController.profile);
router.post('/profile/location', catererController.updateLocation);
router.post('/profile/address', catererController.updateAddress);

// menu yonetimi
router.get('/menu', catererController.menuList);
router.get('/menu/new', catererController.menuNewForm);
router.post('/menu', upload.handleUpload('image'), catererController.menuCreate);
router.get('/menu/:id/edit', catererController.menuEditForm);
router.put('/menu/:id', upload.handleUpload('image'), catererController.menuUpdate);
router.delete('/menu/:id', catererController.menuDelete);

// customization
router.get('/menu/:id/customize', catererController.menuCustomize);
router.post('/menu/:id/option-groups', catererController.optionGroupCreate);
router.post('/menu/:id/option-groups/:groupId/delete', catererController.optionGroupDelete);
router.post('/menu/:id/option-groups/:groupId/options', catererController.optionCreate);
router.post('/menu/:id/options/:optionId/delete', catererController.optionDelete);
router.post('/menu/:id/removables', catererController.removableCreate);
router.post('/menu/:id/removables/:removableId/delete', catererController.removableDelete);

// orders
router.get('/orders', catererController.ordersList);
router.post('/orders/:id/status', catererController.updateOrderStatus);

module.exports = router;
