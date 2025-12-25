const { body, param } = require('express-validator');

exports.logPerformance = [
  body('programId').isMongoId().withMessage('programId is required'),
  body('trainingDayId').isMongoId().withMessage('trainingDayId is required'),
  body('date').isISO8601().withMessage('date must be a valid ISO date'),
  body('performanceData').isArray({ min: 1 }).withMessage('performanceData must be a non-empty array'),
  body('performanceData.*.exerciseId').isMongoId().withMessage('Each performance entry must have an exerciseId'),
  body('performanceData.*.sets').isArray({ min: 1 }).withMessage('Each exercise must have at least one set'),
  body('performanceData.*.sets.*.weight').isFloat({ min: 0 }).withMessage('Set weight must be >= 0'),
  body('performanceData.*.sets.*.reps').isInt({ min: 1 }).withMessage('Set reps must be >= 1'),
];

exports.getWeek = [
  param('programId').isMongoId().withMessage('Invalid program ID'),
  param('weekNumber').isInt({ min: 1 }).withMessage('weekNumber must be a positive integer'),
];

exports.getExerciseProgression = [
  param('programId').isMongoId().withMessage('Invalid program ID'),
  param('exerciseId').isMongoId().withMessage('Invalid exercise ID'),
];
