# Matchmaking Backend API

A production-ready backend API built with Node.js, Express.js, and MongoDB following industry best practices and MVC architecture.

## Features

- **MVC Architecture**: Clean separation of concerns with Models, Views, and Controllers
- **Security First**: Comprehensive security middleware including Helmet, CORS, rate limiting
- **Error Handling**: Global error handling with custom error classes and async error wrapper
- **Environment Configuration**: Secure environment variable management
- **MongoDB Integration**: Production-ready Mongoose configuration with connection handling
- **Response Standardization**: Consistent API response format across all endpoints
- **Input Validation**: Request validation using express-validator
- **Logging**: Request logging with Morgan
- **Graceful Shutdown**: Proper server shutdown handling

## Project Structure

```
├── .github/
│   └── copilot-instructions.md    # Development guidelines
├── config/
│   ├── config.js                  # Environment configuration
│   └── database.js               # MongoDB connection setup
├── constants/
│   └── index.js                  # Application constants
├── controllers/
│   └── sample.controller.js      # Sample controller (remove in production)
├── middlewares/
│   ├── auth.js                   # Authentication middleware
│   ├── errorHandler.js           # Global error handler
│   └── security.js               # Security middleware configuration
├── models/
│   └── User.model.js            # Sample user model
├── routes/
│   ├── index.js                 # Main routes file
│   └── sample.routes.js         # Sample routes (remove in production)
├── services/                    # Business logic services
├── utils/
│   ├── APIError.js             # Custom error class
│   ├── APIResponse.js          # Response utility
│   └── asyncHandler.js         # Async error wrapper
├── validators/
│   └── index.js                # Input validation rules
├── logs/                       # Application logs
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── app.js                     # Express app configuration
├── package.json               # Dependencies and scripts
└── server.js                  # Server startup and configuration
```

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (v5.0 or higher)
- npm (v8.0.0 or higher)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd matchMakingBackend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/matchmaking_db
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Start the server**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

### API Endpoints

#### Health Check

- **GET** `/` - Basic health check
- **GET** `/api/v1/health` - Detailed health check

#### Sample Endpoints (Remove in production)

- **GET** `/api/v1/public-endpoint` - Public data
- **GET** `/api/v1/protected-endpoint` - Protected data (requires auth)
- **POST** `/api/v1/create-resource` - Create resource
- **PUT** `/api/v1/update-resource/:id` - Update resource
- **DELETE** `/api/v1/delete-resource/:id` - Delete resource
- **GET** `/api/v1/admin-only` - Admin only endpoint

## Security Features

- **Helmet**: Sets various HTTP security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Validates and sanitizes all inputs
- **Error Handling**: Prevents information leakage
- **Environment Variables**: Sensitive data protection

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  },
  "timestamp": "2026-02-13T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2026-02-13T10:30:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    /* array of items */
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-02-13T10:30:00.000Z"
}
```

## Error Handling

The application includes a comprehensive error handling system:

- **APIError Class**: Custom error class with status codes
- **Async Handler**: Wraps async functions to catch errors automatically
- **Global Error Handler**: Centralized error processing and response
- **Environment-aware**: Different error details for development/production

## Development Guidelines

1. **Follow MVC Pattern**: Keep controllers thin, use services for business logic
2. **Use Error Classes**: Throw APIError instances with appropriate status codes
3. **Validate Inputs**: Use validators for all incoming data
4. **Write Comments**: Explain business logic and complex operations
5. **Environment Variables**: Never hard-code sensitive values
6. **Consistent Responses**: Always use APIResponse utility

## Logging

The application uses Morgan for HTTP request logging:

- **Development**: Detailed colored logs
- **Production**: Standard combined log format
- **Error Logging**: All errors are logged with stack traces

## Environment Variables

| Variable      | Description               | Default                                  | Required |
| ------------- | ------------------------- | ---------------------------------------- | -------- |
| `PORT`        | Server port               | 3000                                     | No       |
| `NODE_ENV`    | Environment mode          | development                              | No       |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/matchmaking_db | No       |
| `JWT_SECRET`  | JWT signing secret        | -                                        | Yes      |
| `JWT_EXPIRE`  | JWT expiration time       | 7d                                       | No       |
| `CORS_ORIGIN` | Allowed CORS origin       | http://localhost:3000                    | No       |

## Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (to be implemented)
```

## TODO for Production

- [ ] Remove sample controllers and routes
- [ ] Implement actual authentication system
- [ ] Add comprehensive API documentation
- [ ] Set up testing framework
- [ ] Configure production logging
- [ ] Add API rate limiting per user
- [ ] Implement caching strategy
- [ ] Set up monitoring and health checks
- [ ] Configure CI/CD pipeline

## Contributing

1. Follow the established code structure and patterns
2. Add appropriate error handling and validation
3. Update documentation for new features
4. Write tests for new functionality

## License

