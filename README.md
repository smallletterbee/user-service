# User Service

Production-ready User Authentication and Profile Management microservice for Arcane Fortune platform.

## Features

- User registration with email/password/username
- JWT-based authentication (24hr access tokens, 7-day refresh tokens)
- User profile management (avatar, level, experience, stats)
- User preferences (notifications, language, theme)
- Password reset functionality
- PostgreSQL database with auto-migrations
- Kubernetes-ready with health checks
- Docker multi-stage builds

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/validate` - Validate JWT token
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Management
- `GET /api/users/:userId` - Get user with profile and preferences (protected)
- `PUT /api/users/:userId/profile` - Update user profile (protected)
- `PUT /api/users/:userId/preferences` - Update user preferences (protected)

### Health
- `GET /api/health` - Service health check

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Build
npm run build

# Run
npm start

# Development mode (with hot reload)
npm run dev
```

### Testing

```bash
npm test
```

## Environment Variables

```env
PORT=3002
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=arcane_user-service
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

CORS_ORIGIN=http://localhost:3000
```

## Docker

```bash
# Build
docker build -t user-service:latest .

# Run
docker run -p 3002:3002 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=yourpassword \
  -e JWT_SECRET=yoursecret \
  user-service:latest
```

## Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get pods -n game-services
kubectl logs -f <pod-name> -n game-services
```

## Architecture

- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Auth**: JWT with bcrypt password hashing
- **API**: RESTful with proper status codes
- **Testing**: HTTP integration tests (23 scenarios)

## License

Proprietary - Arcane Fortune Platform
