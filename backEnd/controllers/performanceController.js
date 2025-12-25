const WorkoutProgram = require('../models/WorkoutProgram');
const TrainingDay = require('../models/TrainingDay');
const PerformanceEntry = require('../models/PerformanceEntry');
const performanceService = require('../services/performanceService');

/**
 * Log performance for a training day (create or update a PerformanceEntry).
 * POST /api/performance/log
 */
async function logPerformance(req, res) {
  const userId = req.user._id;
  const { programId, trainingDayId, date, performanceData } = req.body;
  // Verify the program belongs to this user and get it (for startDate)
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  // Verify the training day is part of the program
  const trainingDay = await TrainingDay.findOne({ _id: trainingDayId, programId });
  if (!trainingDay) {
    const err = new Error('Training day not found in program');
    err.statusCode = 400;
    throw err;
  }
  // Delegate to service to create/update the PerformanceEntry and compute volumes
  const entry = await performanceService.logPerformance(userId, program, trainingDay, new Date(date), performanceData);
  return res.status(201).json({
    success: true,
    data: entry,
    message: 'Performance logged successfully'
  });
}

/**
 * Get aggregated performance for a given week of a program.
 * GET /api/performance/:programId/week/:weekNumber
 */
async function getWeekPerformance(req, res) {
  const userId = req.user._id;
  const programId = req.params.programId;
  const week = parseInt(req.params.weekNumber, 10);
  // Ensure program exists and belongs to user
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  // Determine current week allowed
  const currentWeek = performanceService.getCurrentWeekNumber(program);
  if (week > currentWeek) {
    const err = new Error('Requested week is in the future or beyond current progress');
    err.statusCode = 403;
    throw err;
  }
  if (week < 1 || week > program.duration) {
    const err = new Error('Week number out of range');
    err.statusCode = 400;
    throw err;
  }
  const summary = await performanceService.getWeekSummary(userId, program, week);
  return res.json({ success: true, data: summary });
}

/**
 * Get all weeks summary for a program up to the current week.
 * GET /api/workouts/programs/:id/weeks
 */
async function getAllWeeks(req, res) {
  const userId = req.user._id;
  const programId = req.params.id;
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  const currentWeek = performanceService.getCurrentWeekNumber(program);
  const summaries = await performanceService.getAllWeeksSummary(userId, program);
  return res.json({ success: true, data: summaries });
}

/**
 * Get the current week summary for a program.
 * GET /api/workouts/programs/:id/weeks/current
 */
async function getCurrentWeek(req, res) {
  const userId = req.user._id;
  const programId = req.params.id;
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  const currentWeek = performanceService.getCurrentWeekNumber(program);
  const summary = await performanceService.getWeekSummary(userId, program, currentWeek);
  return res.json({ success: true, data: summary });
}

/**
 * Get all performance entries for a program.
 * GET /api/performance/:programId
 */
async function getAllPerformanceEntries(req, res) {
  const userId = req.user._id;
  const programId = req.params.programId;
  // Ensure program belongs to user
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  const entries = await PerformanceEntry.find({ programId, userId }).sort({ date: 1 });
  return res.json({ success: true, data: entries });
}

/**
 * Get volume progression for a specific exercise across all weeks of a program.
 * GET /api/performance/:programId/exercise/:exerciseId/progression
 */
async function getExerciseProgression(req, res) {
  const userId = req.user._id;
  const programId = req.params.programId;
  const exerciseId = req.params.exerciseId;
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  // Get volume per week for this exercise
  const weekStats = await performanceService.getAllWeeksSummary(userId, program);
  const progression = weekStats.map(week => {
    const vol = week.exerciseVolumes[exerciseId] || 0;
    return { week: week.week, volume: vol };
  });
  return res.json({ success: true, data: { exerciseId, weeklyVolumes: progression } });
}

module.exports = {
  logPerformance,
  getWeekPerformance,
  getAllWeeks,
  getCurrentWeek,
  getAllPerformanceEntries,
  getExerciseProgression
};
