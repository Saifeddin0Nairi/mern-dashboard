require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require("./ConnectionDB/connectDB");

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const itemRoutes = require('./routes/itemRoutes');
const healthRoutes = require('./routes/healthRoutes');


const workoutRoutes = require('./routes/workoutRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const performanceRoutes = require('./routes/performanceRoutes');

const { errorHandler } = require("./ApiGuards");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/health', healthRoutes);


app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/performance', performanceRoutes);
// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
