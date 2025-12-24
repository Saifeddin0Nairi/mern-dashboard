const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signup = async (name, email, password) => {
  // Create new user (password will be hashed by model pre-save hook)
  const user = new User({ name, email, password });
  await user.save();
  return user;
};

const login = async (email, password) => {
  // Find user by email and explicitly select password for verification
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 400;
    throw err;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 400;
    throw err;
  }
  // Generate JWT (access token)
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  // Get user data without password
  const userData = user.toObject();
  return { token, user: userData };
};

module.exports = { signup, login };
