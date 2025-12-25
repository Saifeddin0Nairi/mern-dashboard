const express = require('express');
const router = express.Router();
const { auth, asyncHandler, validateRequest } = require("../ApiGuards");
const perfValidator = require('../validators/performanceValidator');
const perfController = require('../controllers/performanceController');

// Log performance (create/update PerformanceEntry)
router.post('/log', auth, perfValidator.logPerformance, validateRequest, asyncHandler(perfController.logPerformance));

// Get all performance entries of a program
router.get('/:programId', auth, perfValidator.getWeek, validateRequest, asyncHandler(perfController.getAllPerformanceEntries));

// Get weekly summary for a program (week number in path)
router.get('/:programId/week/:weekNumber', auth, perfValidator.getWeek, validateRequest, asyncHandler(perfController.getWeekPerformance));

// Get exercise progression across weeks
router.get('/:programId/exercise/:exerciseId/progression', auth, perfValidator.getExerciseProgression, validateRequest, asyncHandler(perfController.getExerciseProgression));

module.exports = router;
