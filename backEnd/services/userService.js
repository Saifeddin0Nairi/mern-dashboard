const User = require('../models/User');
const Item = require('../models/Item');

const updateUser = async (userId, data) => {
  // Filter out fields that are not allowed to be updated
  const allowedFields = ['name', 'email', 'bio', 'avatarUrl'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }
  if (Object.keys(updateData).length === 0) {
    const err = new Error('No profile fields provided for update');
    err.statusCode = 400;
    throw err;
  }
  // Update user and return new document
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
  if (!updatedUser) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return updatedUser;
};

const deleteUser = async (userId) => {
  // Delete all items owned by the user
  await Item.deleteMany({ user: userId });
  // Delete the user account
  await User.findByIdAndDelete(userId);
};

module.exports = { updateUser, deleteUser };
