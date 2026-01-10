# Microservices Ticketing App

A production-ready monorepo for building microservices with Express, TypeScript, React/Next.js, Docker, and Kubernetes. Based on Stephen Grider's "Microservices with Node JS and React" Udemy course.

**Project Type:** Microservices Architecture  
**Tech Stack:** Express.js, TypeScript, React/Next.js, Docker, Kubernetes  
**Date Started:** Jan 2026

## 📚 Table of Contents

- [Quick Start](#-quick-start) - Get up and running in minutes
- [Project Overview](#-project-overview) - Architecture and services
- [Monorepo Structure](#-monorepo-structure) - How services are organized
- [Available Scripts](#-available-scripts) - All npm commands
- [Services](#-services) - Individual service documentation
- [Testing](#-testing) - Testing strategy across services
- [Docker & Kubernetes](#-docker--kubernetes) - Containerization and orchestration
- [Development Workflow](#-development-workflow) - Daily development process
- [Git Hooks with Husky](#-git-hooks-with-husky) - Automated code quality
- [Continuous Integration](#-continuous-integration) - GitHub Actions CI/CD
- [Troubleshooting](#-troubleshooting) - Common issues and solutions

## 🚀 Quick Start

### Prerequisites

- Node.js 24+
- Docker & Docker Compose
- Kubernetes (Docker Desktop with K8s enabled, or similar)
- `kubectl` CLI

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd microservices-2-ticketing

# Configure git for consistent line endings (important for husky hooks)
git config core.safecrlf false

# Install all workspace dependencies
npm install

# Install nginx ingress controller (required before running skaffold)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Add ticketing.dev to your hosts file
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts
# Add this line: 127.0.0.1 ticketing.dev

# Start development servers with Skaffold
skaffold dev

# Or for specific services
npm run dev:auth
```

Access the app:
- **Auth Service:** http://ticketing.dev/api/users/currentuser (via Ingress)
- **Local dev:** http://localhost:3000

**Note:** On first access to `ticketing.dev`, Chrome will show a security warning. Type `thisisunsafe` to bypass it (this is normal for local HTTP development).

### Next Steps

1. Update service `.env.local` files with your configuration
2. Review service-specific documentation in each service folder
3. Add additional services following the auth service pattern

## 📋 Project Overview

This is a **monorepo** containing multiple microservices and a frontend application:

```
microservices-2-ticketing/
├── auth/              # Authentication service (Express + TypeScript)
├── tickets/           # Tickets service (future)
├── orders/            # Orders service (future)
├── payments/          # Payments service (future)
├── frontend/          # React/Next.js frontend (future)
├── infra/             # Infrastructure & Kubernetes configs
├── k8s/               # Kubernetes deployment manifests
└── package.json       # Workspace configuration
```

### Architecture Pattern

- **Microservices:** Independent Express services handling specific domains
- **Database per Service:** Each service manages its own data
- **Event-Driven:** Services communicate via events (NATS, RabbitMQ, etc.)
- **Frontend:** Unified React/Next.js application
- **Orchestration:** Kubernetes for production, Skaffold for local development

## 🏗️ Monorepo Structure

This project uses **npm workspaces** to manage multiple services in a single repository.

### Root Package Configuration

```json
{
  "workspaces": [
    "auth",
    "tickets",
    "orders",
    "payments",
    "frontend"
  ]
}
```

### Service Structure

Each service is self-contained with its own:
- `package.json` - Service-specific dependencies
- `tsconfig.json` - Service-specific TypeScript config
- `Dockerfile` - Service containerization
- `src/` - Service source code
- `tests/` - Service tests

### Shared Configuration (Root)

Shared across all services:
- `.eslintrc.js` - Linting rules
- `.prettierrc` - Code formatting
- `.husky/` - Git hooks
- `tsconfig.json` - Base TypeScript config
- `eslint.config.js` - ESLint configuration

## 📝 Available Scripts

### Root Level (Monorepo)

```bash
# Development
npm run dev:auth             # Start auth service in dev mode

# Testing
npm run test                 # Run tests in all services (watch mode)
npm run test:run             # Run tests once (CI mode)
npm coverage                 # Generate coverage reports

# Code Quality
npm run typecheck            # Type check all services
npm run lint                 # Lint all services
npm run lint:fix             # Fix linting issues in all services
npm run format               # Format all files
npm run format:check         # Check formatting
npm run clean                # Clean dist/ in all services

# Skaffold (Kubernetes Development)
skaffold dev                 # Watch mode with hot reload
skaffold build               # Build all service images
```

### Service Level

```bash
# Inside auth/ (or any service)
npm run dev                  # Dev server with hot reload
npm run start                # Run compiled build
npm run build                # Compile TypeScript
npm run test                 # Run tests (watch mode)
npm run test:run             # Run tests once
npm run lint                 # Check linting
npm run typecheck            # Check types
```

## 🔧 Services

### Auth Service

**Purpose:** User authentication, JWT tokens, user management  
**Port:** 3001 (Kubernetes) / 3000 (local dev)  
**Location:** `/auth`

```bash
# Development
npm run dev:auth

# Testing
npm run test --workspace=auth

# Build Docker image
docker build -f auth/Dockerfile -t haryati75/auth:latest .

# Deploy to Kubernetes
kubectl apply -f k8s/auth-depl.yaml
```

**Environment Variables** (`.env.local`):
```
PORT=3000
NODE_ENV=development
```

**Key Endpoints:**
- `POST /api/auth/signup` - Register user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout
- `GET /api/auth/currentuser` - Get current user

### Future Services

- **Tickets Service** - Ticket creation, management, listing
- **Orders Service** - Order creation, payment coordination
- **Payments Service** - Payment processing integration
- **Frontend** - React/Next.js client application

## 🧪 Testing

### Running Tests

```bash
# All services (watch mode)
npm test

# Single service
npm run test --workspace=auth

# Single run (CI mode)
npm test:run

# With coverage
npm coverage
```

### Test Structure

Each service has:
- `src/tests/unit/` - Unit tests for utilities
- `src/tests/integration/` - API endpoint tests
- `src/tests/helper/` - Test utilities and fixtures

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';

describe('Auth API', () => {
  it('should return 404 for unknown routes', async () => {
    await request(app)
      .get('/api/nonexistent')
      .expect(404);
  });
});
```

## 🐳 Docker & Kubernetes

### Local Development with Skaffold

**Prerequisites:** Install nginx ingress controller first:

```bash
# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Verify installation
kubectl get pods -n ingress-nginx
```

Skaffold automates building, pushing, and deploying to Kubernetes:

```bash
# Start development mode (watches for changes, hot reloads)
skaffold dev

# Build images
skaffold build

# Deploy
skaffold deploy
```

**Skaffold Features:**
- Auto-rebuilds images on code changes
- Auto-syncs files to running containers
- Live logs from all services
- Automatic rollback on failures

### Docker Images

```bash
# Build single service
docker build -f auth/Dockerfile -t haryati75/auth:latest .

# Run locally
docker run -p 3001:3001 haryati75/auth:latest

# Push to registry
docker push haryati75/auth:latest
```

### Kubernetes Deployment

```bash
# Deploy all services
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get svc

# View logs
kubectl logs -f deployment/auth-depl

# Port forward to local machine
kubectl port-forward svc/auth-svc 3001:3001

# Cleanup
kubectl delete -f k8s/
```

### Ingress Configuration

Access services via domain instead of port-forwarding:

**Local Setup:**
1. Install nginx ingress controller (if not already installed):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
   ```

2. Edit hosts file:
   - **Windows:** `C:\Windows\System32\drivers\etc\hosts`
   - **Linux/WSL:** `/etc/hosts`
   ```
   127.0.0.1 ticketing.dev
   ```

3. Deploy ingress:
   ```bash
   kubectl apply -f infra/k8s/ingress-srv.yaml
   ```

4. Access: http://ticketing.dev/api/users/currentuser

**Chrome Security Warning:** On first access, Chrome will display a security warning page because the ingress uses HTTP (not HTTPS). This is normal for local development. To proceed:
- Type `thisisunsafe` in the browser window (the text won't appear as you type)
- You'll be redirected to the site

**Why this happens:** Chrome requires HTTPS for production sites. For local HTTP development, Chrome shows this safety check. To avoid this warning, you would need to set up SSL/TLS certificates (not recommended for local development).

## 💡 Development Workflow

### Service Development Process

1. **Start dev mode:**
   ```bash
   skaffold dev
   ```

2. **Make code changes** - Skaffold auto-rebuilds and reloads

3. **Run tests** - `npm test` (in another terminal)

4. **Type check** - `npm run typecheck`

5. **Lint & format** - Run before committing:
   ```bash
   npm run lint:fix
   npm run format
   ```

6. **Commit** - Husky pre-commit hook auto-fixes issues

7. **Push** - CI validates all checks

### Adding a New Service

```bash
# 1. Create service folder
mkdir new-service
cd new-service

# 2. Initialize from auth template
cp -r ../auth/* .
rm -rf dist node_modules

# 3. Update package.json
npm pkg set name="new-service"
npm pkg set description="New service description"

# 4. Add to root workspaces
# Edit root package.json and add "new-service" to workspaces array

# 5. Create Kubernetes manifests
# Copy k8s/auth-depl.yaml and k8s/auth-svc.yaml, rename for new service

# 6. Update skaffold.yaml
# Add new service to build artifacts

# 7. Install dependencies
npm install
```

### Code Organization

```
service/
├── src/
│   ├── index.ts           # Entry point
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   └── tests/
│       ├── unit/          # Unit tests
│       ├── integration/   # API tests
│       └── helper/        # Test utilities
├── package.json           # Service dependencies
├── tsconfig.json          # TypeScript config
├── tsconfig.build.json    # Build-specific config
├── Dockerfile             # Container image
└── vitest.config.ts       # Test config
```

## 🤖 Git Hooks with Husky

Husky automatically enforces code quality on every commit:

```bash
# Make changes
git add .

# Commit (Husky pre-commit hook runs automatically)
git commit -m "feat: add new feature"

# Output:
# ✔ Running tasks for staged files...
# ✔ Applying modifications from tasks...
# [main abc1234] feat: add new feature
```

**What Husky Does:**
1. Runs ESLint on TypeScript files → fixes automatically
2. Runs Prettier on code → formats automatically
3. Commits only if all checks pass

**Skip Hooks (Emergency Only):**
```bash
git commit --no-verify
```

## 🔄 Continuous Integration

GitHub Actions validates every push and pull request:

### CI Checks

1. ✅ **Tests** - All tests must pass
2. ✅ **Type Checking** - No TypeScript errors
3. ✅ **Linting** - Code style validation
4. ✅ **Formatting** - Code format validation
5. ✅ **Coverage** - Code coverage metrics

### Expected Behavior

Since Husky fixes linting/formatting locally:
- ✅ **Code is clean** → CI passes
- ❌ **Tests fail** → Fix and push again
- ❌ **Type errors** → Fix and push again

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found` | Run `npm install` at root and in service |
| Type errors | Run `npm run typecheck` |
| Linting errors | Run `npm run lint:fix` |
| Tests failing | Check `npm test` output |
| Kubernetes 503 error | Check pod status: `kubectl get pods` and logs: `kubectl logs deployment/auth-depl` |
| Skaffold build fails | Verify Docker image name in skaffold.yaml matches service name |
| Port already in use | Change PORT env var or kill process |
| Image not found in K8s | Ensure image is built: `docker build -f auth/Dockerfile -t haryati75/auth .` |

### Common Commands

```bash
# Check workspace setup
npm ls                          # List workspace packages

# Rebuild everything
npm run clean
npm install
npm run build

# Full type check
npm run typecheck

# Reset Kubernetes
kubectl delete -f k8s/
kubectl apply -f k8s/

# View all resources
kubectl get all
```

## 📖 Learning Resources

- [Stephen Grider's Microservices Course](https://www.udemy.com/course/microservices-with-node-js-and-react/)
- [Express Documentation](https://expressjs.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

## 📄 License

MIT

## 👤 Author

Haryati Hassan

## 🙏 Acknowledgments

Based on Stephen Grider's "Microservices with Node JS and React" Udemy course.
