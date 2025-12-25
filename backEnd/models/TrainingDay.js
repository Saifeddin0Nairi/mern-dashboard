const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ExerciseEntrySchema = new Schema({
  exerciseId: { type: Types.ObjectId, ref: 'Exercise', required: true },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 },
  restSeconds: { type: Number, required: true, min: 0 },
  order: { type: Number }  // order of exercise within the muscle group
}, { _id: false });        // _id not needed for subdoc entries

const MuscleGroupEntrySchema = new Schema({
  muscleGroupId: { type: Types.ObjectId, ref: 'MuscleGroup', required: true },
  exercises: [ExerciseEntrySchema]
}, { _id: false });

const TrainingDaySchema = new Schema({
  programId: { type: Types.ObjectId, ref: 'WorkoutProgram', required: true, index: true },
  dayNumber: { type: Number, required: true, min: 1, max: 7 },  // position in week (1=Day1, etc.)
  muscleGroups: [MuscleGroupEntrySchema]
}, { timestamps: true });

// Ensure no duplicate muscleGroupId entries in one TrainingDay
TrainingDaySchema.pre('validate', function(next) {
  if (this.muscleGroups) {
    const seen = new Set();
    for (let mg of this.muscleGroups) {
      const idStr = mg.muscleGroupId.toString();
      if (seen.has(idStr)) {
        return next(new Error('Duplicate muscle group in training day'));
      }
      seen.add(idStr);
      // Also ensure no duplicate exerciseId within each muscle group
      const exIds = mg.exercises.map(ex => ex.exerciseId.toString());
      if (new Set(exIds).size !== exIds.length) {
        return next(new Error('Duplicate exercise in the same muscle group'));
      }
    }
  }
  next();
});

module.exports = mongoose.model('TrainingDay', TrainingDaySchema);
