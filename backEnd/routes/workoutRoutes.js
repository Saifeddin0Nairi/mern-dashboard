const express = require('express');
const router = express.Router();
const { auth, asyncHandler, validateRequest } = require("../ApiGuards");
const programValidator = require('../validators/workoutProgramValidator');
const dayValidator = require('../validators/trainingDayValidator');
const programController = require('../controllers/workoutProgramController');
const dayController = require('../controllers/trainingDayController');
const perfController = require('../controllers/performanceController');

// Workout Programs endpoints
router.post('/programs', auth, programValidator.createProgram, validateRequest, asyncHandler(programController.createProgram));
router.get('/programs', auth, asyncHandler(programController.getAllPrograms));
router.get('/programs/:id', auth, programValidator.updateProgram, validateRequest, asyncHandler(programController.getProgramById));
router.patch('/programs/:id', auth, programValidator.updateProgram, validateRequest, asyncHandler(programController.updateProgram));
router.delete('/programs/:id', auth, programValidator.updateProgram, validateRequest, asyncHandler(programController.deleteProgram));

// Training Days endpoints (nested under a program)
router.get('/programs/:id/days', auth, dayValidator.updateTrainingDay, validateRequest, asyncHandler(dayController.getTrainingDays));
router.get('/programs/:id/days/:dayId', auth, dayValidator.updateTrainingDay, validateRequest, asyncHandler(dayController.getTrainingDayById));
router.patch('/programs/:id/days/:dayId', auth, dayValidator.updateTrainingDay, validateRequest, asyncHandler(dayController.updateTrainingDay));

// Muscle Group management within a training day
router.post('/programs/:id/days/:dayId/muscle-groups', auth, dayValidator.addMuscleGroup, validateRequest, asyncHandler(dayController.addMuscleGroup));
router.patch('/programs/:id/days/:dayId/muscle-groups/:muscleGroupId', auth, dayValidator.updateMuscleGroup, validateRequest, asyncHandler(dayController.updateMuscleGroup));
router.delete('/programs/:id/days/:dayId/muscle-groups/:muscleGroupId', auth, dayValidator.updateMuscleGroup, validateRequest, asyncHandler(dayController.deleteMuscleGroup));

// Exercise management within a muscle group
router.post('/programs/:id/days/:dayId/muscle-groups/:muscleGroupId/exercises', auth, dayValidator.addExercise, validateRequest, asyncHandler(dayController.addExercise));
router.patch('/programs/:id/days/:dayId/muscle-groups/:muscleGroupId/exercises/:exerciseId', auth, dayValidator.updateExercise, validateRequest, asyncHandler(dayController.updateExercise));
router.delete('/programs/:id/days/:dayId/muscle-groups/:muscleGroupId/exercises/:exerciseId', auth, dayValidator.updateExercise, validateRequest, asyncHandler(dayController.deleteExercise));

// Week navigation (program progress)
router.get('/programs/:id/weeks', auth, validateRequest, asyncHandler(perfController.getAllWeeks));
router.get('/programs/:id/weeks/current', auth, validateRequest, asyncHandler(perfController.getCurrentWeek));
router.get('/programs/:id/weeks/:weekNumber', auth, validateRequest, asyncHandler(perfController.getWeekPerformance));

module.exports = router;
