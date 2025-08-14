# City Planner Authentication Server

Standalone authentication server for the City Planner application, connected to Supabase PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=5010
JWT_SECRET=your-super-secure-jwt-secret-key-here-change-this-in-production
DATABASE_URL=your-database-url-here
NODE_ENV=development
```

3. Start the server:
```bash
npm run dev  # for development with nodemon
npm start    # for production
```

## Default Credentials

- `planner@city.dev` / `cityplanner123`
- `dev@hackathon.com` / `cityplanner123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - User logout

### City Planning (Protected Routes)
- `POST /api/init-city` - Initialize new city project
- `POST /api/prompt` - Send prompt to AI agent
- `GET /api/projects` - Get user's city projects
- `GET /api/simulation/:projectId` - Get simulation data
- `POST /api/upload-blueprint` - Upload city blueprint

### Health
- `GET /api/health` - Service health check

## Database

The server automatically creates the required PostgreSQL tables on startup:
- `users` - User authentication data
- `projects` - City planning projects

Database connection is configured for Supabase PostgreSQL with SSL.