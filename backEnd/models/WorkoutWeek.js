const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const WorkoutWeekSchema = new Schema({
  programId: { type: Types.ObjectId, ref: 'WorkoutProgram', index: true },
  userId: { type: Types.ObjectId, ref: 'User', index: true },
  weekNumber: { type: Number, min: 1, max: 12 },
  startDate: { type: Date },
  endDate: { type: Date },
  completedDays: { type: Number, default: 0 },
  volumeByExercise: { type: Map, of: Number },  // exerciseId (as string) -> total volume that week
  totalVolume: { type: Number, default: 0 },
  volumeProgression: { type: Number }  // % change vs previous week (can be negative or null)
}, { timestamps: true });

module.exports = mongoose.model('WorkoutWeek', WorkoutWeekSchema);
