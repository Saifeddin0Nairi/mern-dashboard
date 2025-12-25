const WorkoutProgram = require('../models/WorkoutProgram');
const TrainingDay = require('../models/TrainingDay');
const MuscleGroup = require('../models/MuscleGroup');
const Exercise = require('../models/Exercise');

// Default muscle groups for splits
const UPPER_MGS = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'];
const LOWER_MGS = ['QUADRICEPS', 'GLUTES_HAMSTRINGS', 'CALVES'];

// Create a new workout program and its training days (with default muscle groups)
async function createProgram(userId, data) {
  const { name, trainingFrequency, splitType, duration, startDate } = data;
  const start = startDate ? new Date(startDate) : new Date();
  const program = new WorkoutProgram({
    userId,
    name,
    trainingFrequency,
    splitType,
    duration,
    status: 'active',
    startDate: start,
  });
  await program.save();

  const days = [];
  // Alternate split type starting with splitType
  let current = splitType;
  for (let i = 1; i <= trainingFrequency; i++) {
    const groupNames = (current === 'UPPER') ? UPPER_MGS : LOWER_MGS;
    const groups = await MuscleGroup.find({ name: { $in: groupNames } });
    const day = new TrainingDay({
      programId: program._id,
      dayNumber: i,
      muscleGroups: groups.map(mg => ({
        muscleGroupId: mg._id,
        exercises: []
      }))
    });
    await day.save();
    days.push(day);
    // alternate for next day
    current = (current === 'UPPER') ? 'LOWER' : 'UPPER';
  }
  return { program, days };
}

async function getPrograms(userId) {
  return await WorkoutProgram.find({ userId });
}

async function getProgramById(userId, programId) {
  const program = await WorkoutProgram.findOne({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found');
    err.statusCode = 404;
    throw err;
  }
  return program;
}

async function updateProgram(userId, programId, data) {
  const program = await WorkoutProgram.findOneAndUpdate(
    { _id: programId, userId },
    data,
    { new: true, runValidators: true }
  );
  if (!program) {
    const err = new Error('Program not found');
    err.statusCode = 404;
    throw err;
  }
  return program;
}

async function deleteProgram(userId, programId) {
  const program = await WorkoutProgram.findOneAndDelete({ _id: programId, userId });
  if (!program) {
    const err = new Error('Program not found');
    err.statusCode = 404;
    throw err;
  }
  // Clean up related training days
  await TrainingDay.deleteMany({ programId });
}

// Get all training days for a program (user verified)
async function getTrainingDays(userId, programId) {
  await getProgramById(userId, programId);
  return await TrainingDay.find({ programId });
}

async function getTrainingDay(userId, programId, dayId) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  return day;
}

async function updateTrainingDay(userId, programId, dayId, data) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOneAndUpdate(
    { _id: dayId, programId },
    data,
    { new: true, runValidators: true }
  );
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  return day;
}

async function addMuscleGroupToDay(userId, programId, dayId, muscleGroupId, exercisesArray) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  if (day.muscleGroups.some(mg => mg.muscleGroupId.toString() === muscleGroupId)) {
    const err = new Error('Muscle group already exists in this day');
    err.statusCode = 400;
    throw err;
  }
  day.muscleGroups.push({ muscleGroupId, exercises: exercisesArray || [] });
  await day.save();
  return day;
}

async function updateMuscleGroupInDay(userId, programId, dayId, muscleGroupId, exercisesArray) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const mgEntry = day.muscleGroups.id(muscleGroupId);
  if (!mgEntry) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  mgEntry.exercises = exercisesArray || mgEntry.exercises;
  await day.save();
  return day;
}

async function deleteMuscleGroupInDay(userId, programId, dayId, muscleGroupId) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) {
    const err = new Error('Training day not found');
    err.statusCode = 404;
    throw err;
  }
  const originalCount = day.muscleGroups.length;
  day.muscleGroups = day.muscleGroups.filter(mg => mg.muscleGroupId.toString() !== muscleGroupId);
  if (day.muscleGroups.length === originalCount) {
    const err = new Error('Muscle group not found in this day');
    err.statusCode = 404;
    throw err;
  }
  await day.save();
}

async function addExerciseToMuscleGroup(userId, programId, dayId, muscleGroupId, exerciseId, sets, reps, restSeconds, order) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) throw Object.assign(new Error('Training day not found'), { statusCode: 404 });
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === muscleGroupId);
  if (!mgEntry) throw Object.assign(new Error('Muscle group not found'), { statusCode: 404 });
  if (mgEntry.exercises.some(ex => ex.exerciseId.toString() === exerciseId)) {
    const err = new Error('Exercise already exists in this muscle group');
    err.statusCode = 400;
    throw err;
  }
  mgEntry.exercises.push({ exerciseId, sets, reps, restSeconds, order });
  await day.save();
  return day;
}

async function updateExerciseInMuscleGroup(userId, programId, dayId, muscleGroupId, exerciseId, data) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) throw Object.assign(new Error('Training day not found'), { statusCode: 404 });
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === muscleGroupId);
  if (!mgEntry) throw Object.assign(new Error('Muscle group not found'), { statusCode: 404 });
  const exEntry = mgEntry.exercises.find(ex => ex.exerciseId.toString() === exerciseId);
  if (!exEntry) throw Object.assign(new Error('Exercise not found in this muscle group'), { statusCode: 404 });
  // Update allowed fields
  ['sets','reps','restSeconds','order'].forEach(field => {
    if (data[field] !== undefined) {
      exEntry[field] = data[field];
    }
  });
  await day.save();
  return day;
}

async function deleteExerciseFromMuscleGroup(userId, programId, dayId, muscleGroupId, exerciseId) {
  await getProgramById(userId, programId);
  const day = await TrainingDay.findOne({ _id: dayId, programId });
  if (!day) throw Object.assign(new Error('Training day not found'), { statusCode: 404 });
  const mgEntry = day.muscleGroups.find(mg => mg.muscleGroupId.toString() === muscleGroupId);
  if (!mgEntry) throw Object.assign(new Error('Muscle group not found'), { statusCode: 404 });
  const originalCount = mgEntry.exercises.length;
  mgEntry.exercises = mgEntry.exercises.filter(ex => ex.exerciseId.toString() !== exerciseId);
  if (mgEntry.exercises.length === originalCount) {
    const err = new Error('Exercise not found in this muscle group');
    err.statusCode = 404;
    throw err;
  }
  await day.save();
}

// Week helpers (could compute or just return structure)
async function getWeeks(userId, programId) {
  const program = await getProgramById(userId, programId);
  // Return an array of week numbers [1, 2, ..., duration]
  return Array.from({ length: program.duration }, (_, i) => i + 1);
}

async function getCurrentWeek(userId, programId) {
  const program = await getProgramById(userId, programId);
  const diffMs = Date.now() - program.startDate.getTime();
  let week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  if (week < 1) week = 1;
  if (week > program.duration) week = program.duration;
  return week;
}

async function getWeekByNumber(userId, programId, weekNumber) {
  const program = await getProgramById(userId, programId);
  if (weekNumber < 1 || weekNumber > program.duration) {
    const err = new Error('Week number out of range');
    err.statusCode = 400;
    throw err;
  }
  return weekNumber;
}

module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  getTrainingDays,
  getTrainingDay,
  updateTrainingDay,
  addMuscleGroupToDay,
  updateMuscleGroupInDay,
  deleteMuscleGroupInDay,
  addExerciseToMuscleGroup,
  updateExerciseInMuscleGroup,
  deleteExerciseFromMuscleGroup,
  getWeeks,
  getCurrentWeek,
  getWeekByNumber,
};
