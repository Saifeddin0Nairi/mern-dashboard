const router = require('express').Router();
const { body, query, param } = require('express-validator');
const { asyncHandler, auth, validateRequest } = require("../ApiGuards");
const itemController = require('../controllers/itemController');

// All routes in this router are protected (must be logged in)
router.use(auth);

// POST /api/items
router.post('/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('status').optional().isIn(['todo', 'doing', 'done']).withMessage('Status must be one of: todo, doing, done')
  ],
  validateRequest,
  asyncHandler(itemController.createItem)
);

// GET /api/items
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    query('status').optional().isIn(['todo', 'doing', 'done']).withMessage('Status filter must be todo, doing, or done')
  ],
  validateRequest,
  asyncHandler(itemController.getItems)
);

// GET /api/items/:id
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Invalid item ID')
  ],
  validateRequest,
  asyncHandler(itemController.getItem)
);

// PATCH /api/items/:id
router.patch('/:id',
  [
    param('id').isMongoId().withMessage('Invalid item ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('status').optional().isIn(['todo', 'doing', 'done']).withMessage('Status must be one of: todo, doing, done')
  ],
  validateRequest,
  asyncHandler(itemController.updateItem)
);

// DELETE /api/items/:id
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Invalid item ID')
  ],
  validateRequest,
  asyncHandler(itemController.deleteItem)
);

module.exports = router;
