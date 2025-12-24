const router = require('express').Router();
const { body } = require('express-validator');
const { asyncHandler, auth, validateRequest } = require("../ApiGuards");

const profileController = require('../controllers/profileController');

// All routes in this router are protected
router.use(auth);

// GET /api/profile/me
router.get('/me', asyncHandler(profileController.getProfile));

// PATCH /api/profile/me
router.patch('/me',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('bio').optional().isString().withMessage('Bio must be a string'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL must be valid')
  ],
  validateRequest,
  asyncHandler(profileController.updateProfile)
);

// DELETE /api/profile/me
router.delete('/me', asyncHandler(profileController.deleteProfile));

module.exports = router;
