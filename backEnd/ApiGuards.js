const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

let User;
try {
  // If ApiGuards.js is in project root
  User = require("./models/User");
} catch (e) {
  // If ApiGuards.js is in /middleware
  User = require("../models/User");
}

/**
 * Wrap async controllers so errors go to the global error handler
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * express-validator result handler
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation error");
    err.statusCode = 400;
    err.errors = errors.array().map((e) => e.msg);
    return next(err);
  }

  next();
};

/**
 * Auth guard: requires Authorization: Bearer <token>
 * (KEEP SAME BEHAVIOR)
 */
const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    }

    // KEEP: attach the full user doc
    req.user = user;
    return next();
  } catch (e) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }
};

/**
 * Helper: always get the authenticated userId consistently
 * Supports: req.user, req.user.id, req.user._id, req.userId
 */
const getUserId = (req) => {
  if (req.user && (req.user._id || req.user.id)) return (req.user._id || req.user.id).toString();
  if (req.userId) return req.userId.toString();
  return null;
};

/**
 * Optional helpers for standardized success responses
 */
const sendSuccess = (res, data, message, statusCode = 200) => {
  const payload = { success: true };
  if (data !== undefined) payload.data = data;
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
};

/**
 * Central error handler (STANDARDIZED JSON)
 * { success:false, error: string | string[] }
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    err.statusCode = 400;
    err.message = err.message || "Validation Error";
  }

  // Mongo duplicate key (unique index)
  if (err.code === 11000) {
    err.statusCode = 400;
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : "";
    err.message = field
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      : "Duplicate value";
  }

  const status = err.statusCode || 500;

  // express-validator style aggregated messages
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(status).json({ success: false, error: err.errors });
  }

  return res
    .status(status)
    .json({ success: false, error: err.message || "Internal Server Error" });
};

module.exports = {
  asyncHandler,
  validateRequest,
  auth,
  errorHandler,
  getUserId,
  sendSuccess,
};
