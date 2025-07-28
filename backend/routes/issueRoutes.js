const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

// Protect all routes
router.use(protect);

// GET all issues with author information and comment counts
router.get("/", async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    // Get comment counts for each issue
    const issuesWithComments = await Promise.all(
      issues.map(async (issue) => {
        const commentCount = await Comment.countDocuments({ issue: issue._id });
        return {
          ...issue.toObject(),
          commentCount
        };
      })
    );
    
    res.json({
      success: true,
      data: issuesWithComments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// GET current user's issues with comment counts
router.get("/my-issues", async (req, res) => {
  try {
    const issues = await Issue.find({ author: req.user.id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    // Get comment counts for each issue
    const issuesWithComments = await Promise.all(
      issues.map(async (issue) => {
        const commentCount = await Comment.countDocuments({ issue: issue._id });
        return {
          ...issue.toObject(),
          commentCount
        };
      })
    );
    
    res.json({
      success: true,
      data: issuesWithComments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// GET current user's issue statistics
router.get("/my-stats", async (req, res) => {
  try {
    const total = await Issue.countDocuments({ author: req.user.id });
    const open = await Issue.countDocuments({ author: req.user.id, status: "Open" });
    const inProgress = await Issue.countDocuments({ author: req.user.id, status: "In Progress" });
    const resolved = await Issue.countDocuments({ author: req.user.id, status: "Resolved" });
    const closed = await Issue.countDocuments({ author: req.user.id, status: "Closed" });

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        solved: resolved + closed,
        ongoing: open + inProgress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// GET single issue with author and comments
router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('author', 'name email');
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// CREATE issue
router.post("/", async (req, res) => {
  try {
    const issueData = {
      ...req.body,
      author: req.user.id
    };
    const issue = await Issue.create(issueData);
    const populatedIssue = await Issue.findById(issue._id)
      .populate('author', 'name email');
    
    res.status(201).json({
      success: true,
      data: populatedIssue
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// UPDATE issue
router.put("/:id", async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE issue
router.delete("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    await Issue.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "Issue deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// GET comments for an issue
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ issue: req.params.id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ADD comment to an issue
router.post("/:id/comments", async (req, res) => {
  try {
    const { content } = req.body;
    
    // Check if issue exists
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    
    const comment = await Comment.create({
      content,
      author: req.user.id,
      issue: req.params.id
    });
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email');
    
    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
