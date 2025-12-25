const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ExerciseSchema = new Schema({
  name: { type: String, required: true },
  muscleGroupId: { type: Types.ObjectId, ref: 'MuscleGroup', required: true, index: true },
  equipment: { type: String },  // e.g. barbell, dumbbell, machine, bodyweight, etc.
  difficulty: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  videoUrl: { type: String, default: '' },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);
