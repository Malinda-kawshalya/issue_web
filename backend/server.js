const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Load environment variables
require("dotenv").config(); 

// Import routes
const issueRoutes = require("./routes/issueRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// CORS configuration - fix for frontend origin
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Basic middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/issues", issueRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Issue Tracker API',
    endpoints: {
      issues: '/api/issues',
      auth: '/api/auth'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
