const WorkoutProgram = require('../models/WorkoutProgram');
const TrainingDay = require('../models/TrainingDay');
const MuscleGroup = require('../models/MuscleGroup');
const Exercise = require('../models/Exercise');

async function createProgram(userId, { name, trainingFrequency, splitType, duration, startDate }) {
  // Create program document
  const program = new WorkoutProgram({ 
    userId, name, trainingFrequency, splitType, duration, startDate 
  });
  await program.save();
  
  // Pre-fetch all muscle groups into a map (name -> doc) for quick access
  const muscleGroups = await MuscleGroup.find({});
  const mgMap = {};
  muscleGroups.forEach(mg => { mgMap[mg.name] = mg; });
  
  // Determine pattern: sequence of 'UPPER' or 'LOWER' for each training day index
  const dayPatterns = []; 
  for (let i = 1; i <= trainingFrequency; i++) {
    let isUpperDay;
    if (splitType === 'UPPER') {
      isUpperDay = (i % 2 === 1);  // odd: upper, even: lower
    } else { // 'LOWER'
      isUpperDay = (i % 2 === 0);  // even: upper, odd: lower (so odd days are lower)
    }
    dayPatterns.push(isUpperDay ? 'UPPER' : 'LOWER');
  }
  
  // Default muscle group lists for each type
  const upperGroups = ['CHEST','BACK','SHOULDERS','BICEPS','TRICEPS'];
  const lowerGroups = ['QUADRICEPS','GLUTES_HAMSTRINGS','CALVES'];
  
  // Create training day documents
  const trainingDays = [];
  for (let dayIndex = 0; dayIndex < dayPatterns.length; dayIndex++) {
    const dayNumber = dayIndex + 1;
    const type = dayPatterns[dayIndex]; // 'UPPER' or 'LOWER'
    const mgNames = (type === 'UPPER') ? upperGroups : lowerGroups;
    // Build muscleGroups array for this training day
    const muscleGroupsEntries = [];
    for (let mgName of mgNames) {
      const mgDoc = mgMap[mgName];
      if (!mgDoc) continue;  // safety check, should exist from seed
      // Pick one default exercise for this muscle group
      let defaultExercises = [];
      if (mgDoc.exercises && mgDoc.exercises.length > 0) {
        // choose the first exercise in the muscle group list as default
        defaultExercises = [ mgDoc.exercises[0] ];
      }
      // Construct exercise subdoc entries with default sets/reps
      const exercisesEntries = defaultExercises.map((exId, idx) => ({
        exerciseId: exId,
        sets: 3,
        reps: 10,
        restSeconds: 60,
        order: idx + 1
      }));
      muscleGroupsEntries.push({ muscleGroupId: mgDoc._id, exercises: exercisesEntries });
    }
    const trainingDay = new TrainingDay({ programId: program._id, dayNumber, muscleGroups: muscleGroupsEntries });
    await trainingDay.save();
    trainingDays.push(trainingDay);
  }
  
  // Prepare output: include program and its trainingDays
  const programObj = program.toObject();
  programObj.trainingDays = trainingDays;
  return programObj;
}

module.exports = { createProgram };
