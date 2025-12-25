const mongoose = require('mongoose');
const { Schema } = mongoose;

const MuscleGroupSchema = new Schema({
  name: { 
    type: String, 
    enum: [
      'CHEST','BACK','SHOULDERS','BICEPS','TRICEPS',
      'QUADRICEPS','GLUTES_HAMSTRINGS','CALVES','ABS','OTHER'
    ], 
    unique: true, 
    required: true 
  },
  exercises: [{ type: mongoose.Types.ObjectId, ref: 'Exercise' }]  // all exercises belonging to this group
}, { timestamps: true });

module.exports = mongoose.model('MuscleGroup', MuscleGroupSchema);
