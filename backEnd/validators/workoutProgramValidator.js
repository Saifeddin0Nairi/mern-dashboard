const { body, param } = require('express-validator');

exports.createProgram = [
  body('name').trim().notEmpty().withMessage('Program name is required'),
  body('trainingFrequency')
    .isInt({ min: 3, max: 6 }).withMessage('Training frequency must be an integer between 3 and 6'),
  body('splitType')
    .isIn(['UPPER', 'LOWER']).withMessage('splitType must be either UPPER or LOWER'),
  body('duration')
    .isInt({ min: 4, max: 12 }).withMessage('Program duration must be 4-12 weeks'),
  body('startDate').optional().isISO8601().toDate().withMessage('Invalid startDate format'),
];

exports.updateProgram = [
  param('id').isMongoId().withMessage('Invalid program ID'),
  body('name').optional().isString().notEmpty().withMessage('Name cannot be empty'),
  body('status').optional().isIn(['active','completed','archived'])
    .withMessage('Status must be active, completed, or archived'),
];
