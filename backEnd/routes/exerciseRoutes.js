const express = require('express');
const router = express.Router();
const { auth, asyncHandler, validateRequest } = require("../ApiGuards");
const { query } = require('express-validator');
const exerciseController = require('../controllers/exerciseController');

// List or filter exercises (auth optional depending on design; here we protect it as well)
router.get('/', auth,
  // Validate optional query param
  query('muscleGroupId').optional().isMongoId().withMessage('Invalid muscleGroupId'),
  validateRequest,
  asyncHandler(exerciseController.getAllExercises)
);

module.exports = router;
