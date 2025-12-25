const WorkoutProgram = require('../models/WorkoutProgram');
const TrainingDay = require('../models/TrainingDay');
const programService = require('../services/programService');

/**
 * Create a new workout program and auto-generate its training days with default structure.
 * POST /api/workouts/programs
 */
async function createProgram(req, res) {
  const userId = req.user._id;
  const { name, trainingFrequency, splitType, duration, startDate } = req.body;
  // Use current date as default startDate if not provided
  const programStart = startDate ? new Date(startDate) : new Date();
  
  // Call service to create program and training days
  const program = await programService.createProgram(userId, { 
    name, trainingFrequency, splitType, duration, startDate: programStart 
  });
  
  return res.status(201).json({
    success: true,
    data: program,
    message: 'Workout program created successfully'
  });
}

/**
 * Get all workout programs of the logged-in user.
 * GET /api/workouts/programs
 */
async function getAllPrograms(req, res) {
  const userId = req.user._id;
  const programs = await WorkoutProgram.find({ userId }).sort({ createdAt: -1 });
  return res.json({ success: true, data: programs });
}

/**
 * Get a single workout program by ID (if it belongs to the user).
 * GET /api/workouts/programs/:id
 */
async function getProgramById(req, res) {
  const userId = req.user._id;
  const programId = req.params.id;
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found');
    err.statusCode = 404;
    throw err;
  }
  // Also fetch training days of this program for completeness
  const trainingDays = await TrainingDay.find({ programId });
  return res.json({ 
    success: true, 
    data: { program, trainingDays } 
  });
}

/**
 * Update a workout program (e.g. rename or change status).
 * PATCH /api/workouts/programs/:id
 */
async function updateProgram(req, res) {
  const userId = req.user._id;
  const programId = req.params.id;
  // Only allow certain fields to be updated
  const updateData = {};
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.status) updateData.status = req.body.status;
  // (We do not support changing frequency, duration, or split via this endpoint)
  const program = await WorkoutProgram.findOneAndUpdate(
    { _id: programId, userId }, 
    updateData, 
    { new: true }
  );
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  return res.json({
    success: true,
    data: program,
    message: 'Workout program updated'
  });
}

/**
 * Delete a workout program and its related data.
 * DELETE /api/workouts/programs/:id
 */
async function deleteProgram(req, res) {
  const userId = req.user._id;
  const programId = req.params.id;
  // Delete the program (if it belongs to user)
  const program = await WorkoutProgram.findOneAndDelete({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found or not authorized');
    err.statusCode = 404;
    throw err;
  }
  // Cascade delete related training days and performance entries
  await TrainingDay.deleteMany({ programId });
  const PerformanceEntry = require('../models/PerformanceEntry');
  await PerformanceEntry.deleteMany({ programId });
  // (We do not delete exercises or muscle groups, as those are global library entries)
  return res.json({ success: true, message: 'Workout program deleted' });
}

module.exports = {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram
};
