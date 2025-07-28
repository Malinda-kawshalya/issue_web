const mongoose = require('mongoose');
const Issue = require('./models/Issue');
const User = require('./models/User');
require('dotenv').config();

// Sample issues data
const issues = [
  {
    title: "Login form validation not working",
    description: "Users can submit empty login forms without proper validation",
    severity: "High",
    priority: "High",
    status: "Open",
    category: "Bug",
    assignee: "John Doe",
    reporter: "Jane Smith",
    tags: ["frontend", "validation", "login"]
  },
  {
    title: "Add dark mode theme",
    description: "Implement a dark mode toggle for better user experience",
    severity: "Low",
    priority: "Medium",
    status: "In Progress",
    category: "Feature",
    assignee: "Alice Johnson",
    reporter: "Bob Wilson",
    tags: ["ui", "theme", "enhancement"]
  },
  {
    title: "Database connection timeout",
    description: "Random database connection timeouts causing application crashes",
    severity: "Critical",
    priority: "Urgent",
    status: "Open",
    category: "Bug",
    assignee: "Mike Davis",
    reporter: "Sarah Connor",
    tags: ["database", "backend", "performance"]
  },
  {
    title: "API documentation update",
    description: "Update API documentation to reflect recent changes",
    severity: "Low",
    priority: "Low",
    status: "Open",
    category: "Documentation",
    assignee: "Tom Brown",
    reporter: "Lisa White",
    tags: ["documentation", "api"]
  },
  {
    title: "Performance optimization",
    description: "Optimize application performance for better user experience",
    severity: "Medium",
    priority: "Medium",
    status: "Resolved",
    category: "Enhancement",
    assignee: "David Lee",
    reporter: "Emma Jones",
    tags: ["performance", "optimization"]
  },
  {
    title: "Email notification system",
    description: "Implement email notifications for issue updates",
    severity: "Medium",
    priority: "High",
    status: "Open",
    category: "Feature",
    assignee: "Chris Taylor",
    reporter: "Mark Anderson",
    tags: ["email", "notifications", "feature"]
  },
  {
    title: "Mobile responsive design",
    description: "Make the application mobile-friendly and responsive",
    severity: "Medium",
    priority: "Medium",
    status: "In Progress",
    category: "Enhancement",
    assignee: "Jennifer Garcia",
    reporter: "Robert Miller",
    tags: ["mobile", "responsive", "ui"]
  },
  {
    title: "Security vulnerability in user authentication",
    description: "Potential security issue found in user authentication process",
    severity: "Critical",
    priority: "Urgent",
    status: "Closed",
    category: "Bug",
    assignee: "Security Team",
    reporter: "Security Audit",
    tags: ["security", "authentication", "critical"]
  }
];

// Sample users data
const users = [
  {
    name: "Admin User",
    email: "admin@issuetracker.com",
    password: "admin123",
    role: "admin"
  },
  {
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: "user"
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    role: "user"
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Import data
const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Issue.deleteMany();
    await User.deleteMany();
    
    console.log('Existing data cleared');
    
    // Insert sample data
    await User.insertMany(users);
    console.log('Users imported successfully');
    
    await Issue.insertMany(issues);
    console.log('Issues imported successfully');
    
    console.log('Data import completed successfully');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDB();
    
    await Issue.deleteMany();
    await User.deleteMany();
    
    console.log('Data deleted successfully');
    process.exit();
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1);
  }
};

// Run seeder based on command line argument
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Usage:');
  console.log('npm run seed:import  - Import sample data');
  console.log('npm run seed:delete  - Delete all data');
  console.log('Or use: node seeder.js -i (import) or node seeder.js -d (delete)');
  process.exit();
}
