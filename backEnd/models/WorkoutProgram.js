const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const WorkoutProgramSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  trainingFrequency: { type: Number, required: true, min: 3, max: 6 },  // 3-6 days/week
  splitType: { type: String, enum: ['UPPER', 'LOWER'], required: true }, // type of split (pattern start)
  duration: { type: Number, required: true, min: 4, max: 12 },  // 4-12 weeks
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  startDate: { type: Date, required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('WorkoutProgram', WorkoutProgramSchema);
