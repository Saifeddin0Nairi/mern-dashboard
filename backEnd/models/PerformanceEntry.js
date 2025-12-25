const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const SetPerformanceSchema = new Schema({
  setNumber: { type: Number },
  weight: { type: Number, required: true, min: 0 },  // kg (can be 0 for bodyweight)
  reps: { type: Number, required: true, min: 1 },
  volume: { type: Number, required: true, min: 0 }   // computed = weight * reps
}, { _id: false });

const ExercisePerformanceSchema = new Schema({
  exerciseId: { type: Types.ObjectId, ref: 'Exercise', required: true },
  sets: [SetPerformanceSchema],
  totalVolume: { type: Number, required: true, min: 0 }  // sum of volumes of sets
}, { _id: false });

const PerformanceEntrySchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  programId: { type: Types.ObjectId, ref: 'WorkoutProgram', required: true, index: true },
  trainingDayId: { type: Types.ObjectId, ref: 'TrainingDay', required: true },
  date: { type: Date, required: true, index: true },
  weekNumber: { type: Number, required: true, min: 1, max: 12, index: true },
  performanceData: [ExercisePerformanceSchema],    // performance by exercise
  dayTotalVolume: { type: Number, required: true, min: 0 }  // total volume of that day
}, { timestamps: true });

// Unique index to ensure one entry per user+program+day+date
PerformanceEntrySchema.index(
  { userId: 1, programId: 1, trainingDayId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('PerformanceEntry', PerformanceEntrySchema);
