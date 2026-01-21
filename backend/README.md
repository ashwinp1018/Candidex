# Candidex Backend

AI-based mock interview system backend built with Node.js and Express.

## Features

- User authentication with JWT
- MongoDB database with Mongoose
- Interview session management
- Mock AI-based question generation and evaluation
- Protected routes with authentication middleware
- Comprehensive error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ "name": "string", "email": "string", "password": "string" }`

- `POST /api/auth/login` - Login user
  - Body: `{ "email": "string", "password": "string" }`

### Interview (Protected - requires JWT token)

- `POST /api/interview/start` - Start a new interview session
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "role": "string", "difficulty": "easy|medium|hard" }`

- `POST /api/interview/submit` - Submit interview answers
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "sessionId": "string", "answers": ["string", ...] }`

## Project Structure

```
/src
  /config
    db.js              # MongoDB connection
  /models
    User.js            # User model
    InterviewSession.js # Interview session model
  /routes
    authRoutes.js      # Authentication routes
    interviewRoutes.js # Interview routes
  /controllers
    authController.js  # Authentication logic
    interviewController.js # Interview logic
  /middleware
    authMiddleware.js  # JWT authentication middleware
    errorMiddleware.js # Error handling middleware
  app.js               # Express app configuration
  server.js            # Server entry point
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing

## License

ISC
