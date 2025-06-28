# Order & Inventory Service

This project is a skeleton for an Order & Inventory Service built with Node.js, TypeScript, Fastify, Prisma, PostgreSQL, and Redis.

## Prerequisites & Tools Setup

Before you begin, ensure you have the following installed on your machine:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Docker & Docker Compose**
   - **Windows/Mac**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - **Linux**: Install Docker Engine and Docker Compose separately
   - Verify installation: `docker --version` and `docker-compose --version`

3. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Package Manager (Choose One)

This project uses `pnpm` by default (indicated by `pnpm-lock.yaml`), but you can use any of these:
- **pnpm** (recommended): `npm install -g pnpm`
- **npm** (comes with Node.js)
- **yarn**: `npm install -g yarn`

### Recommended IDE & Extensions

**Visual Studio Code** with these extensions:
- **Prisma** - Syntax highlighting for Prisma schema
- **TypeScript** - TypeScript language support
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker** - Docker file support
- **Thunder Client** or **REST Client** - For API testing

### Optional Tools

- **PostgreSQL Client** (for direct database access):
  - [pgAdmin](https://www.pgadmin.org/) (GUI)
  - [DBeaver](https://dbeaver.io/) (Universal database tool)
- **Redis Client**:
  - [Redis Desktop Manager](https://redis.com/redis-enterprise/redis-insight/)

## Quick Start

### 1. Clone & Navigate to Project
```bash
git clone <repository-url>
cd Backend-developer-assignment
```

### 2. Install Dependencies
Choose your preferred package manager:
```bash
# Using pnpm (recommended)
pnpm install

# OR using npm
npm install

# OR using yarn
yarn install
```

### 3. Environment Setup
Copy the example environment file and configure it:
```bash
cp dotenv.example .env
```

**Important**: The default `.env` values work with Docker Compose, but you may need to adjust ports if they conflict with existing services on your machine.

### 4. Docker Compose Configuration

The `docker-compose.yml` file is pre-configured but you may need to adjust these settings:

#### Port Conflicts
If you have existing services running on these ports, update the port mappings:

```yaml
services:
  app:
    ports:
      - "3000:3000"  # Change left side if port 3000 is taken
  
  db:
    ports:
      - "5433:5432"  # Change to "5432:5432" if port 5432 is free
                     # or "5434:5432" if both 5432 and 5433 are taken
  
  cache:
    ports:
      - "6379:6379"  # Change left side if Redis is already running
```

#### Database Credentials (Optional)
You can customize database credentials in `docker-compose.yml`:

```yaml
services:
  db:
    environment:
      POSTGRES_USER: your_username      # Change from 'user'
      POSTGRES_PASSWORD: your_password  # Change from 'password'
      POSTGRES_DB: your_database_name   # Change from 'mydb'
```

**Note**: If you change database credentials, update the `DATABASE_URL` in the app service environment section accordingly.

### 5. Start the Services
```bash
docker compose up
```

For background execution:
```bash
docker compose up -d
```

### 6. Database Setup
In a new terminal, run the database migrations:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev
```

## Verification & Health Check

### 1. Service Health
Once all services are running, verify the application:
```bash
curl http://localhost:3000/healthz
```
Expected response: `{"status":"ok"}`

### 2. Database Connection
Check if the database is accessible:
```bash
# Using Prisma Studio (opens in browser)
npm run prisma:studio
```

### 3. Service Ports
Verify all services are running:
- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5433 (or your custom port)
- **Redis**: localhost:6379 (or your custom port)
- **Prisma Studio**: http://localhost:5555

## Development Workflow

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Start production server
- `npm run test`: Run Jest tests
- `npm test -- --coverage`: Run Jest tests coverage
- `npm run lint`: Lint and format code
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate:dev`: Create and apply new migrations
- `npm run prisma:migrate:deploy`: Apply migrations (production)
- `npm run prisma:studio`: Open Prisma Studio database GUI

### API Documentation
When the service is running, access:
- **Swagger UI**: http://localhost:3000/documentation
- **API Endpoints**: See [Assignment.md](./Assignment.md) for requirements

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port mappings in `docker-compose.yml`
   - Kill existing processes: `lsof -ti:3000 | xargs kill -9`

2. **Docker Permission Issues (Linux)**
   ```bash
   sudo usermod -aG docker $USER
   # Then logout and login again
   ```

3. **Database Connection Issues**
   - Ensure PostgreSQL container is running: `docker compose ps`
   - Check database logs: `docker compose logs db`

4. **Node Modules Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Prisma Issues**
   ```bash
   # Reset and regenerate
   npm run prisma:generate
   npx prisma db push --force-reset
   ```

## Stopping the Services

```bash
# Stop services (preserves data)
docker compose down

# Stop and remove volumes (deletes data)
docker compose down -v
```

## Project Architecture

- **Framework**: Fastify (Node.js web framework)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose

## Next Steps

1. Review the project requirements in [Assignment.md](./Assignment.md)
2. Implement the required API endpoints
3. Add proper error handling and validation
4. Write comprehensive tests
5. Set up CI/CD pipeline (optional)

For more details on the project requirements, see [Assignment.md](./Assignment.md). 