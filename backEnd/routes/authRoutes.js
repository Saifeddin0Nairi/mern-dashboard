const router = require('express').Router();
const { body } = require('express-validator');
const { asyncHandler, auth, validateRequest } = require("../ApiGuards"); 
const authController = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  validateRequest,
  asyncHandler(authController.signup)
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  asyncHandler(authController.login)
);

// POST /api/auth/logout (protected)
router.post('/logout', auth, asyncHandler(authController.logout));

// GET /api/auth/me (protected)
router.get('/me', auth, asyncHandler(authController.getCurrentUser));

module.exports = router;
