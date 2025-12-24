const userService = require('../services/userService');

const getProfile = (req, res) => {
  // req.user is set in auth middleware
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  const updatedUser = await userService.updateUser(req.user._id, req.body);
  res.json(updatedUser);
};

const deleteProfile = async (req, res) => {
  await userService.deleteUser(req.user._id);
  res.json({ message: 'User profile and all items deleted successfully' });
};

module.exports = { getProfile, updateProfile, deleteProfile };
