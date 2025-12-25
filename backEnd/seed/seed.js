require('dotenv').config();
const mongoose = require('mongoose');
const MuscleGroup = require('../models/MuscleGroup');
const Exercise = require('../models/Exercise');
const muscleGroupsData = require('./muscleGroups.seed');
const exercisesData = require('./exercises.seed');

async function runSeed() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI not set in .env');
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB...');
    // Clear existing data (to avoid duplicates on re-run)
    await MuscleGroup.deleteMany({});
    await Exercise.deleteMany({});
    console.log('Cleared MuscleGroup and Exercise collections');
    // Insert muscle groups
    const mgDocs = await MuscleGroup.insertMany(muscleGroupsData);
    console.log(`Inserted ${mgDocs.length} muscle groups`);
    // Create a map of muscleGroup name to id
    const mgMap = {};
    mgDocs.forEach(mg => { mgMap[mg.name] = mg._id; });
    // Replace muscleGroup names with ObjectId references in exercises data
    exercisesData.forEach(ex => {
      ex.muscleGroupId = mgMap[ex.muscleGroup];
      delete ex.muscleGroup;
    });
    // Insert exercises
    const exDocs = await Exercise.insertMany(exercisesData);
    console.log(`Inserted ${exDocs.length} exercises`);
    // Update MuscleGroup docs with references to exercises
    // Group exercises by muscleGroupId
    const exercisesByGroup = {};
    exDocs.forEach(ex => {
      const mgId = ex.muscleGroupId.toString();
      if (!exercisesByGroup[mgId]) exercisesByGroup[mgId] = [];
      exercisesByGroup[mgId].push(ex._id);
    });
    for (let [mgId, exIds] of Object.entries(exercisesByGroup)) {
      await MuscleGroup.findByIdAndUpdate(mgId, { $set: { exercises: exIds } });
    }
    console.log('Updated muscle groups with exercise references');
    console.log('Seeding completed successfully');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.disconnect();
  }
}

runSeed();
