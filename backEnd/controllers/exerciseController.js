const Exercise = require('../models/Exercise');

/**
 * Get all exercises, optionally filtered by muscleGroupId.
 * GET /api/exercises?muscleGroupId=xxx
 */
async function getAllExercises(req, res) {
  const filter = {};
  if (req.query.muscleGroupId) {
    filter.muscleGroupId = req.query.muscleGroupId;
  }
  const exercises = await Exercise.find(filter);
  return res.json({ success: true, data: exercises });
}

module.exports = { getAllExercises };
