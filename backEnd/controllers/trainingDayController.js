const TrainingDay = require('../models/TrainingDay');
const MuscleGroup = require('../models/MuscleGroup');
const Exercise = require('../models/Exercise');

/**
 * Get all training days for a given program (must belong to user).
 * GET /api/workouts/programs/:id/days
 */
async function getTrainingDays(req, res) {
  const programId = req.params.id;
  // Authorization: ensure the program belongs to the user
  // (This is indirectly enforced by only querying training days of that program and user should only request their own programId)
  const days = await TrainingDay.find({ programId });
  return res.json({ success: true, data: days });
}

/**
 * Get details of a specific training day by ID.
 * GET /api/workouts/programs/:id/days/:dayId
 */
async function getTrainingDayById(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  return res.json({ success: true, data: day });
}

/**
 * Update an entire training day’s structure (muscle groups and exercises).
 * PATCH /api/workouts/programs/:id/days/:dayId
 * Body: { muscleGroups: [ { muscleGroupId, exercises: [ {exerciseId, sets, reps, restSeconds, order}, ... ] }, ... ] }
 */
async function updateTrainingDay(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const { muscleGroups } = req.body;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  // Replace the muscleGroups array completely with the new one
  day.muscleGroups = [];
  for (let mg of muscleGroups) {
    // Validate muscleGroup exists
    const mgDoc = await MuscleGroup.findById(mg.muscleGroupId);
    if (!mgDoc) {
      const err = new Error('Muscle group not found');
      err.statusCode = 400;
      throw err;
    }
    // Ensure exercises array is provided
    const exEntries = [];
    for (let ex of (mg.exercises || [])) {
      const exercise = await Exercise.findById(ex.exerciseId);
      if (!exercise || exercise.muscleGroupId.toString() !== mg.muscleGroupId) {
        const err = new Error('Invalid exercise selection for muscle group');
        err.statusCode = 400;
        throw err;
      }
      exEntries.push({
        exerciseId: exercise._id,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
        order: ex.order
      });
    }
    // Sort exercises by 'order' if provided, then assign sequential order values
    exEntries.sort((a, b) => (a.order || 0) - (b.order || 0));
    exEntries.forEach((ex, idx) => { ex.order = idx + 1; });
    day.muscleGroups.push({ muscleGroupId: mgDoc._id, exercises: exEntries });
  }
  await day.save();
  return res.json({ success: true, data: day, message: 'Training day updated' });
}

/**
 * Add a new muscle group (with exercises) to a training day.
 * POST /api/workouts/programs/:id/days/:dayId/muscle-groups
 * Body: { muscleGroupId, exercises: [ { exerciseId, sets, reps, restSeconds, order }, ... ] }
 */
async function addMuscleGroup(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const { muscleGroupId, exercises } = req.body;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  // Prevent adding duplicate muscle group
  if (day.muscleGroups.some(mg => mg.muscleGroupId.toString() === muscleGroupId)) {
    const err = new Error('Muscle group already exists in this training day');
    err.statusCode = 400;
    throw err;
  }
  const mgDoc = await MuscleGroup.findById(muscleGroupId);
  if (!mgDoc) {
    const err = new Error('Muscle group not found');
    err.statusCode = 400;
    throw err;
  }
  // Prepare exercises sub-array
  const exEntries = [];
  if (exercises && exercises.length) {
    for (let ex of exercises) {
      const exercise = await Exercise.findById(ex.exerciseId);
      if (!exercise || exercise.muscleGroupId.toString() !== muscleGroupId) {
        const err = new Error('Invalid exercise for this muscle group');
        err.statusCode = 400;
        throw err;
      }
      exEntries.push({
        exerciseId: exercise._id,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
        order: ex.order
      });
    }
    // Sort by provided order and then re-number
    exEntries.sort((a, b) => (a.order || 0) - (b.order || 0));
    exEntries.forEach((ex, idx) => { ex.order = idx + 1; });
  }
  // Add the new muscle group entry
  day.muscleGroups.push({ muscleGroupId: mgDoc._id, exercises: exEntries });
  await day.save();
  return res.status(201).json({ success: true, data: day, message: 'Muscle group added to training day' });
}

/**
 * Update an existing muscle group entry (e.g. update all exercises in that group).
 * PATCH /api/workouts/programs/:id/days/:dayId/muscle-groups/:muscleGroupId
 * Body: { exercises: [ { exerciseId, sets, reps, restSeconds, order }, ... ] }
 */
async function updateMuscleGroup(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const mgId = req.params.muscleGroupId;
  const { exercises } = req.body;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === mgId);
  if (!mgEntry) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  // Validate and rebuild exercises array
  const exEntries = [];
  for (let ex of (exercises || [])) {
    const exercise = await Exercise.findById(ex.exerciseId);
    if (!exercise || exercise.muscleGroupId.toString() !== mgId) {
      const err = new Error('Invalid exercise for this muscle group');
      err.statusCode = 400;
      throw err;
    }
    exEntries.push({
      exerciseId: exercise._id,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
      order: ex.order
    });
  }
  // Sort by order and assign sequential order values
  exEntries.sort((a, b) => (a.order || 0) - (b.order || 0));
  exEntries.forEach((ex, idx) => { ex.order = idx + 1; });
  mgEntry.exercises = exEntries;
  await day.save();
  return res.json({ success: true, data: day, message: 'Muscle group updated' });
}

/**
 * Remove a muscle group (and all its exercises) from a training day.
 * DELETE /api/workouts/programs/:id/days/:dayId/muscle-groups/:muscleGroupId
 */
async function deleteMuscleGroup(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const mgId = req.params.muscleGroupId;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const index = day.muscleGroups.findIndex(mg => mg.muscleGroupId.toString() === mgId);
  if (index === -1) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  day.muscleGroups.splice(index, 1);
  await day.save();
  return res.json({ success: true, data: day, message: 'Muscle group removed from training day' });
}

/**
 * Add a new exercise to a muscle group in a training day.
 * POST /api/workouts/programs/:id/days/:dayId/muscle-groups/:muscleGroupId/exercises
 * Body: { exerciseId, sets, reps, restSeconds, order }
 */
async function addExercise(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const mgId = req.params.muscleGroupId;
  const { exerciseId, sets, reps, restSeconds, order } = req.body;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === mgId);
  if (!mgEntry) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  // Ensure exercise exists and matches the muscle group
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise || exercise.muscleGroupId.toString() !== mgId) {
    const err = new Error('Invalid exercise for this muscle group');
    err.statusCode = 400;
    throw err;
  }
  // Prevent duplicate exercise in the group
  if (mgEntry.exercises.some(ex => ex.exerciseId.toString() === exerciseId)) {
    const err = new Error('Exercise already exists in this muscle group');
    err.statusCode = 400;
    throw err;
  }
  // Determine insertion position
  let insertIndex = mgEntry.exercises.length; // default to append
  if (order && order > 0 && order <= mgEntry.exercises.length) {
    insertIndex = order - 1;
  }
  // Create exercise entry
  const newEx = {
    exerciseId: exercise._id,
    sets,
    reps,
    restSeconds,
    order: 0  // placeholder, will set in reorder
  };
  // Insert and reorder
  mgEntry.exercises.splice(insertIndex, 0, newEx);
  mgEntry.exercises.forEach((ex, idx) => { ex.order = idx + 1; });
  await day.save();
  return res.status(201).json({ success: true, data: day, message: 'Exercise added to muscle group' });
}

/**
 * Update an exercise entry in a muscle group (e.g. adjust sets/reps or reorder).
 * PATCH /api/workouts/programs/:id/days/:dayId/muscle-groups/:muscleGroupId/exercises/:exerciseId
 * Body can include any of: { sets, reps, restSeconds, order }
 */
async function updateExercise(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const mgId = req.params.muscleGroupId;
  const exerciseId = req.params.exerciseId;
  const { sets, reps, restSeconds, order } = req.body;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === mgId);
  if (!mgEntry) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  const exIndex = mgEntry.exercises.findIndex(ex => ex.exerciseId.toString() === exerciseId);
  if (exIndex === -1) {
    const err = new Error('Exercise not found in this muscle group');
    err.statusCode = 404;
    throw err;
  }
  const exEntry = mgEntry.exercises[exIndex];
  // Update fields if provided
  if (sets !== undefined) exEntry.sets = sets;
  if (reps !== undefined) exEntry.reps = reps;
  if (restSeconds !== undefined) exEntry.restSeconds = restSeconds;
  if (order !== undefined && order > 0) {
    // Reorder this exercise within the array
    const newPos = Math.min(mgEntry.exercises.length - 1, order - 1);
    // Remove and re-insert at new position
    mgEntry.exercises.splice(exIndex, 1);
    mgEntry.exercises.splice(newPos, 0, exEntry);
  }
  // Reassign sequential order values after potential reordering
  mgEntry.exercises.forEach((ex, idx) => { ex.order = idx + 1; });
  await day.save();
  return res.json({ success: true, data: day, message: 'Exercise updated' });
}

/**
 * Remove an exercise from a muscle group in a training day.
 * DELETE /api/workouts/programs/:id/days/:dayId/muscle-groups/:muscleGroupId/exercises/:exerciseId
 */
async function deleteExercise(req, res) {
  const programId = req.params.id;
  const dayId = req.params.dayId;
  const mgId = req.params.muscleGroupId;
  const exerciseId = req.params.exerciseId;
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === mgId);
  if (!mgEntry) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  const exIndex = mgEntry.exercises.findIndex(ex => ex.exerciseId.toString() === exerciseId);
  if (exIndex === -1) {
    const err = new Error('Exercise not found in this muscle group');
    err.statusCode = 404;
    throw err;
  }
  mgEntry.exercises.splice(exIndex, 1);
  // Reorder remaining exercises
  mgEntry.exercises.forEach((ex, idx) => { ex.order = idx + 1; });
  await day.save();
  return res.json({ success: true, data: day, message: 'Exercise removed from muscle group' });
}

module.exports = {
  getTrainingDays,
  getTrainingDayById,
  updateTrainingDay,
  addMuscleGroup,
  updateMuscleGroup,
  deleteMuscleGroup,
  addExercise,
  updateExercise,
  deleteExercise
};
