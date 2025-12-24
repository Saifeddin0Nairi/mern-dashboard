const router = require('express').Router();
const { getHealth } = require('../controllers/healthController');

// GET /api/health
router.get('/', getHealth);

module.exports = router;
