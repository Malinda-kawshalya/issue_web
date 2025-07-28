/**
 * Issue Data Model
 * 
 * Mongoose schema for issue tracking system.
 * Defines the structure and validation rules for issue documents.
 * 
 * @model Issue
 * @description Represents a trackable issue/task in the system
 */

const mongoose = require("mongoose");

/**
 * Issue Schema Definition
 * @typedef {Object} Issue
 * @property {string} title - Issue title (required)
 * @property {string} description - Detailed issue description
 * @property {string} status - Current status (Open, In Progress, Resolved, Closed)
 * @property {string} priority - Issue priority level (Low, Medium, High, Urgent)
 * @property {string} assignee - Person assigned to handle the issue
 * @property {ObjectId} author - User who created the issue (required)
 * @property {Date} createdAt - Issue creation timestamp (auto-generated)
 * @property {Date} updatedAt - Last update timestamp (auto-generated)
 */
const IssueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    minlength: [3, 'Title must be at least 3 characters long']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  
  status: {
    type: String,
    enum: {
      values: ["Open", "In Progress", "Resolved", "Closed"],
      message: 'Status must be one of: Open, In Progress, Resolved, Closed'
    },
    default: "Open",
    required: true
  },
  
  priority: {
    type: String,
    enum: {
      values: ["Low", "Medium", "High", "Urgent"],
      message: 'Priority must be one of: Low, Medium, High, Urgent'
    },
    default: "Low",
    required: true
  },
  
  assignee: {
    type: String,
    trim: true,
    maxlength: [100, 'Assignee name cannot exceed 100 characters'],
    default: ''
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issue author is required'],
    index: true // Index for faster queries by author
  }
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true },  // Include virtuals when converting to JSON
  toObject: { virtuals: true }
});

/**
 * Virtual field for issue age in days
 * @returns {number} Number of days since issue creation
 */
IssueSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field to check if issue is overdue (based on priority)
 * @returns {boolean} True if issue is considered overdue
 */
IssueSchema.virtual('isOverdue').get(function() {
  const ageInDays = this.ageInDays;
  const overdueThresholds = {
    'Urgent': 1,   // 1 day
    'High': 3,     // 3 days
    'Medium': 7,   // 1 week
    'Low': 14      // 2 weeks
  };
  
  return ageInDays > (overdueThresholds[this.priority] || 14);
});

/**
 * Instance method to update issue status
 * @param {string} newStatus - New status to set
 * @returns {Promise<Issue>} Updated issue document
 */
IssueSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

/**
 * Static method to find issues by status
 * @param {string} status - Status to filter by
 * @returns {Promise<Issue[]>} Array of issues with specified status
 */
IssueSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('author', 'name email');
};

/**
 * Static method to find issues by priority
 * @param {string} priority - Priority level to filter by
 * @returns {Promise<Issue[]>} Array of issues with specified priority
 */
IssueSchema.statics.findByPriority = function(priority) {
  return this.find({ priority }).populate('author', 'name email');
};

/**
 * Static method to get issue statistics
 * @returns {Promise<Object>} Statistics object with counts by status and priority
 */
IssueSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ["$priority", "Urgent"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$priority", "Medium"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$priority", "Low"] }, 1, 0] } }
      }
    }
  ]);
};

/**
 * Pre-save middleware to validate data
 */
IssueSchema.pre('save', function(next) {
  // Ensure title is properly formatted
  if (this.title) {
    this.title = this.title.trim();
  }
  
  // Ensure assignee is properly formatted
  if (this.assignee) {
    this.assignee = this.assignee.trim();
  }
  
  next();
});

/**
 * Create indexes for better query performance
 */
IssueSchema.index({ status: 1, priority: 1 });
IssueSchema.index({ createdAt: -1 });
IssueSchema.index({ author: 1, status: 1 });

module.exports = mongoose.model("Issue", IssueSchema);
