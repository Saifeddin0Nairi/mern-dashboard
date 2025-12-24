const authService = require('../services/authService');

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.signup(name, email, password);
  // Respond with created user (password omitted by schema)
  res.status(201).json(user);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  // result contains token and user fields
  res.json(result);
};

const logout = (req, res) => {
  // Stateless logout: just indicate success
  res.status(200).json({ message: 'Logged out successfully' });
};

const getCurrentUser = (req, res) => {
  // req.user is set in auth middleware
  res.json(req.user);
};

module.exports = { signup, login, logout, getCurrentUser };
