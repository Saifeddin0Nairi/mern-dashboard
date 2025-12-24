const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("./models/User");

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

    req.user = user;
    return next();
  } catch (e) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }
};

/**
 * Central error handler (consistent JSON)
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

  // express-validator style
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(status).json({ errors: err.errors });
  }

  return res.status(status).json({ error: err.message || "Internal Server Error" });
};

module.exports = {
  asyncHandler,
  validateRequest,
  auth,
  errorHandler,
};
