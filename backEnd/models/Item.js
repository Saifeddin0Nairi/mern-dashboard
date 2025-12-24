const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' }
}, { timestamps: true });

// Index to optimize queries by user and status
ItemSchema.index({ user: 1, status: 1 });

// Customize JSON to remove __v and use id instead of _id
ItemSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    if (ret.user) {
      ret.user = ret.user.toString();
    }
    return ret;
  }
});

module.exports = mongoose.model('Item', ItemSchema);
