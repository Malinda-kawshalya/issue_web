/**
 * Issue Tracker Backend Server
 * 
 * Express.js server with MongoDB integration for issue tracking application.
 * Provides RESTful API endpoints for authentication and issue management.
 * 
 * Features:
 * - Authentication with JWT
 * - Issue CRUD operations
 * - File upload for profile pictures
 * - CORS configuration for frontend integration
 * - Environment-based configuration
 * 
 * @author Issue Tracker Team
 * @version 1.0.0
 */

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

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

/**
 * CORS Configuration
 * Allows requests from development frontend servers
 */
const corsOptions = {
  origin: [
    'http://localhost:3000',  // React dev server
    'http://localhost:5173',  // Vite dev server
    'http://localhost:5174'   // Alternative Vite port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

// Core Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

/**
 * Database Connection
 * Connect to MongoDB using connection string from environment
 */
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Initialize database connection
connectDatabase();

/**
 * API Routes
 */
app.use("/api/issues", issueRoutes);
app.use("/api/auth", authRoutes);

/**
 * Health Check Endpoint
 * @route GET /api/health
 * @description Server health status
 * @access Public
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Root Endpoint
 * @route GET /
 * @description API information and available endpoints
 * @access Public
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Issue Tracker API',
    version: '1.0.0',
    endpoints: {
      issues: '/api/issues',
      auth: '/api/auth',
      health: '/api/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

/**
 * 404 Handler for undefined routes
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

/**
 * Server Startup
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

/**
 * Graceful shutdown handling
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('📦 Database connection closed');
  process.exit(0);
});

module.exports = app;
