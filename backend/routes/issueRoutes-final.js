/**
 * Issue Routes Module
 * 
 * RESTful API endpoints for issue management system.
 * Handles CRUD operations for issues and associated comments.
 * 
 * @module issueRoutes
 * @requires express
 * @requires ../models/Issue
 * @requires ../models/Comment
 * @requires ../middleware/auth
 */

const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

/**
 * Apply authentication middleware to all routes
 * All routes in this module require user authentication
 */
router.use(protect);

/**
 * @route   GET /api/issues
 * @desc    Get all issues with author information and comment counts
 * @access  Private
 * @returns {Object} Response with array of issues
 */
router.get("/", async (req, res) => {
  try {
    // Fetch all issues with author details, sorted by creation date (newest first)
    const issues = await Issue.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    // Calculate comment count for each issue
    const issuesWithComments = await Promise.all(
      issues.map(async (issue) => {
        const commentCount = await Comment.countDocuments({ issue: issue._id });
        return {
          ...issue.toObject(),
          commentCount,
          ageInDays: issue.ageInDays,
          isOverdue: issue.isOverdue
        };
      })
    );
    
    res.json({
      success: true,
      count: issuesWithComments.length,
      data: issuesWithComments
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/issues/my-issues
 * @desc    Get current user's issues with comment counts
 * @access  Private
 * @returns {Object} Response with user's issues
 */
router.get("/my-issues", async (req, res) => {
  try {
    // Fetch issues created by the authenticated user
    const issues = await Issue.find({ author: req.user.id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    // Calculate comment count for each issue
    const issuesWithComments = await Promise.all(
      issues.map(async (issue) => {
        const commentCount = await Comment.countDocuments({ issue: issue._id });
        return {
          ...issue.toObject(),
          commentCount,
          ageInDays: issue.ageInDays,
          isOverdue: issue.isOverdue
        };
      })
    );
    
    res.json({
      success: true,
      count: issuesWithComments.length,
      data: issuesWithComments
    });
  } catch (error) {
    console.error('Error fetching user issues:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your issues",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/issues/my-stats
 * @desc    Get current user's issue statistics
 * @access  Private
 * @returns {Object} Response with user's issue statistics
 */
router.get("/my-stats", async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Calculate various statistics for user's issues
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      Issue.countDocuments({ author: userId }),
      Issue.countDocuments({ author: userId, status: "Open" }),
      Issue.countDocuments({ author: userId, status: "In Progress" }),
      Issue.countDocuments({ author: userId, status: "Resolved" }),
      Issue.countDocuments({ author: userId, status: "Closed" })
    ]);

    const statistics = {
      total,
      open,
      inProgress,
      resolved,
      closed,
      solved: resolved + closed,
      ongoing: open + inProgress,
      completionRate: total > 0 ? ((resolved + closed) / total * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/issues/:id
 * @desc    Get single issue with author information
 * @access  Private
 * @param   {string} id - Issue ID
 * @returns {Object} Response with issue details
 */
router.get("/:id", async (req, res) => {
  try {
    const issueId = req.params.id;
    
    // Validate ObjectId format
    if (!issueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format"
      });
    }
    
    const issue = await Issue.findById(issueId)
      .populate('author', 'name email');
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    // Add virtual fields to response
    const issueWithVirtuals = {
      ...issue.toObject(),
      ageInDays: issue.ageInDays,
      isOverdue: issue.isOverdue
    };
    
    res.json({
      success: true,
      data: issueWithVirtuals
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issue",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/issues
 * @desc    Create new issue
 * @access  Private
 * @body    {Object} Issue data (title, description, status, priority, assignee)
 * @returns {Object} Response with created issue
 */
router.post("/", async (req, res) => {
  try {
    // Prepare issue data with authenticated user as author
    const issueData = {
      ...req.body,
      author: req.user.id
    };
    
    // Create new issue
    const issue = await Issue.create(issueData);
    
    // Populate author information for response
    const populatedIssue = await Issue.findById(issue._id)
      .populate('author', 'name email');
    
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: populatedIssue
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create issue",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/issues/:id
 * @desc    Update existing issue
 * @access  Private
 * @param   {string} id - Issue ID
 * @body    {Object} Updated issue data
 * @returns {Object} Response with updated issue
 */
router.put("/:id", async (req, res) => {
  try {
    const issueId = req.params.id;
    
    // Validate ObjectId format
    if (!issueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format"
      });
    }
    
    // Check if issue exists and user has permission
    const existingIssue = await Issue.findById(issueId);
    if (!existingIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    // Optional: Check if user owns the issue (uncomment if needed)
    // if (existingIssue.author.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Not authorized to update this issue"
    //   });
    // }
    
    // Update issue with validation
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('author', 'name email');
    
    res.json({
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update issue",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/issues/:id
 * @desc    Delete issue
 * @access  Private
 * @param   {string} id - Issue ID
 * @returns {Object} Response confirming deletion
 */
router.delete("/:id", async (req, res) => {
  try {
    const issueId = req.params.id;
    
    // Validate ObjectId format
    if (!issueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format"
      });
    }
    
    const issue = await Issue.findById(issueId);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    // Optional: Check if user owns the issue (uncomment if needed)
    // if (issue.author.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Not authorized to delete this issue"
    //   });
    // }
    
    // Delete the issue
    await Issue.findByIdAndDelete(issueId);
    
    // Also delete associated comments
    await Comment.deleteMany({ issue: issueId });
    
    res.json({
      success: true,
      message: "Issue and associated comments deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete issue",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/issues/:id/comments
 * @desc    Get comments for a specific issue
 * @access  Private
 * @param   {string} id - Issue ID
 * @returns {Object} Response with array of comments
 */
router.get("/:id/comments", async (req, res) => {
  try {
    const issueId = req.params.id;
    
    // Validate ObjectId format
    if (!issueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format"
      });
    }
    
    // Check if issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    // Fetch comments for the issue
    const comments = await Comment.find({ issue: issueId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/issues/:id/comments
 * @desc    Add comment to an issue
 * @access  Private
 * @param   {string} id - Issue ID
 * @body    {Object} Comment data (content)
 * @returns {Object} Response with created comment
 */
router.post("/:id/comments", async (req, res) => {
  try {
    const issueId = req.params.id;
    const { content } = req.body;
    
    // Validate ObjectId format
    if (!issueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format"
      });
    }
    
    // Validate comment content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }
    
    // Check if issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    // Create new comment
    const comment = await Comment.create({
      content: content.trim(),
      author: req.user.id,
      issue: issueId
    });
    
    // Populate author information for response
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email');
    
    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
