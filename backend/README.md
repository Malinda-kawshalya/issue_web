# Simple Issue Tracker Backend

A simplified REST API for the Issue Tracker application built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**
  - User registration and login
  - JWT-based authentication
  - Protected routes

- **Issue Management**
  - Create, read, update, delete issues
  - Simple issue tracking with status and priority

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file:
   ```env
   MONGO_URL=your-mongodb-connection-string
   PORT=5000
   JWT_SECRET=your-secret-key
   ```

3. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Issues (All Protected)
- `GET /api/issues` - Get all issues
- `GET /api/issues/:id` - Get single issue
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed)
}
```

### Issue
```javascript
{
  title: String (required),
  description: String,
  status: String (Open/In Progress/Resolved/Closed),
  priority: String (Low/Medium/High/Urgent),
  assignee: String
}
```

## Authentication

All issue routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Example Requests

### Register User
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login User
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Issue
```bash
POST /api/issues
Authorization: Bearer <token>
{
  "title": "Bug in login form",
  "description": "Users cannot login with valid credentials",
  "status": "Open",
  "priority": "High"
}
```

This simplified version removes all the complex validation, middleware, and features while keeping the core functionality intact.
