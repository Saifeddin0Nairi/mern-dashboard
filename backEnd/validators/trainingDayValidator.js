const { body, param } = require('express-validator');

exports.updateTrainingDay = [
  param('id').isMongoId().withMessage('Invalid program ID'),
  param('dayId').isMongoId().withMessage('Invalid training day ID'),
  body('muscleGroups').isArray({ min: 0 }).withMessage('muscleGroups must be an array'),
  body('muscleGroups.*.muscleGroupId').isMongoId().withMessage('Invalid muscleGroupId'),
  // Validate each exercise entry in muscleGroups
  body('muscleGroups.*.exercises').isArray().withMessage('Exercises must be an array'),
  body('muscleGroups.*.exercises.*.exerciseId').isMongoId().withMessage('Invalid exerciseId'),
  body('muscleGroups.*.exercises.*.sets').isInt({ min: 1 }).withMessage('sets must be a positive integer'),
  body('muscleGroups.*.exercises.*.reps').isInt({ min: 1 }).withMessage('reps must be a positive integer'),
  body('muscleGroups.*.exercises.*.restSeconds').isInt({ min: 0 }).withMessage('restSeconds must be >= 0'),
];

exports.addMuscleGroup = [
  param('id').isMongoId().withMessage('Invalid program ID'),
  param('dayId').isMongoId().withMessage('Invalid training day ID'),
  body('muscleGroupId').isMongoId().withMessage('muscleGroupId is required'),
  body('exercises').optional().isArray().withMessage('exercises must be an array'),
  body('exercises.*.exerciseId').isMongoId().withMessage('Invalid exerciseId in exercises'),
  body('exercises.*.sets').isInt({ min: 1 }).withMessage('sets must be a positive integer'),
  body('exercises.*.reps').isInt({ min: 1 }).withMessage('reps must be a positive integer'),
  body('exercises.*.restSeconds').isInt({ min: 0 }).withMessage('restSeconds must be >= 0'),
];

exports.updateMuscleGroup = [
  param('id').isMongoId().withMessage('Invalid program ID'),
  param('dayId').isMongoId().withMessage('Invalid training day ID'),
  param('muscleGroupId').isMongoId().withMessage('Invalid muscleGroup ID'),
  body('exercises').isArray().withMessage('exercises must be an array'),
  body('exercises.*.exerciseId').isMongoId().withMessage('Invalid exerciseId in exercises'),
  body('exercises.*.sets').isInt({ min: 1 }).withMessage('sets must be a positive integer'),
  body('exercises.*.reps').isInt({ min: 1 }).withMessage('reps must be a positive integer'),
  body('exercises.*.restSeconds').isInt({ min: 0 }).withMessage('restSeconds must be >= 0'),
];

exports.addExercise = [
  param('id').isMongoId().withMessage('Invalid program ID'),
  param('dayId').isMongoId().withMessage('Invalid training day ID'),
  param('muscleGroupId').isMongoId().withMessage('Invalid muscleGroup ID'),
  body('exerciseId').isMongoId().withMessage('exerciseId is required'),
  body('sets').isInt({ min: 1 }).withMessage('sets must be a positive integer'),
  body('reps').isInt({ min: 1 }).withMessage('reps must be a positive integer'),
  body('restSeconds').isInt({ min: 0 }).withMessage('restSeconds must be >= 0'),
  body('order').optional().isInt({ min: 1 }).withMessage('order must be a positive integer'),
];

exports.updateExercise = [
  param('id').isMongoId().withMessage('Invalid program ID'),
  param('dayId').isMongoId().withMessage('Invalid training day ID'),
  param('muscleGroupId').isMongoId().withMessage('Invalid muscleGroup ID'),
  param('exerciseId').isMongoId().withMessage('Invalid exercise ID'),
  body('sets').optional().isInt({ min: 1 }).withMessage('sets must be >= 1'),
  body('reps').optional().isInt({ min: 1 }).withMessage('reps must be >= 1'),
  body('restSeconds').optional().isInt({ min: 0 }).withMessage('restSeconds must be >= 0'),
  body('order').optional().isInt({ min: 1 }).withMessage('order must be >= 1'),
];
