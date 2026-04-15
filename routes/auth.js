const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.registerForm);
router.post('/register', authController.register);

router.get('/login', authController.loginForm);
router.post('/login', authController.login);

// navbar DELETE method-override ile gonderiyor
router.delete('/logout', authController.logout);

module.exports = router;
