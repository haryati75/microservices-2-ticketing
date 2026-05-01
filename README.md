# Microservices Ticketing App

A production-ready monorepo for building microservices with Express, TypeScript, React/Next.js, Docker, and Kubernetes. Based on Stephen Grider's "Microservices with Node JS and React" Udemy course.

**Project Type:** Microservices Architecture  
**Tech Stack:** Express.js, TypeScript, React/Next.js, Docker, Kubernetes  
**Date Started:** Jan 2026

## 📚 Table of Contents

- [Project Progress](#-project-progress) - Current completion status at a glance
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
- [What's Next](#-whats-next) - Remaining work to reach a fully functional app
- [Troubleshooting](#-troubleshooting) - Common issues and solutions

## 🗺️ Project Progress

This is a course follow-along project. The table below shows what has been built so far and what still needs to be done.

| Area | Status | Notes |
|------|--------|-------|
| **Auth service** | ✅ Complete | Signup, signin, signout, currentuser, JWT |
| **Tickets service** | ✅ Complete | CRUD routes + event publishing/listening |
| **Orders service** | ✅ Complete | CRUD routes + event publishing/listening |
| **Expiration service** | ✅ Complete | Bull/Redis delayed queue + event publishing |
| **Payments service** | 🚧 In progress | Order replica + event listeners done; payment route + Stripe integration pending |
| **Client (Next.js)** | 🚧 In progress | Auth pages done; tickets, orders, and payment UI pages pending |
| **Shared common package** | ✅ Complete | Published as `@charityx/common` — all event contracts, base classes, middleware |
| **Kubernetes infra** | ✅ Complete | Deployments for all services + NATS + Redis |

See [What's Next](#-whats-next) for a detailed breakdown of the remaining work.

---

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

# Install all workspace dependencies
npm install

# Install nginx ingress controller (required before running skaffold)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Create JWT secret required by auth service
kubectl create secret generic jwt-secret --from-literal=JWT_KEY=your_jwt_key

# Expose auth Mongo on an alternate host port (avoid clashing with a local Mongo on 27017)
kubectl port-forward svc/auth-mongo-srv 27018:27017
# Or run port-forward in background (detached)
kubectl port-forward svc/auth-mongo-srv 27018:27017 >/tmp/auth-mongo-portforward.log 2>&1 &
# Stop later with: pkill -f "port-forward svc/auth-mongo-srv 27018:27017"

# Mongo connection string (using forwarded port)
mongodb://localhost:27018/auth

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
3. See [What's Next](#-whats-next) for the remaining implementation work

## 📋 Project Overview

This is a **monorepo** containing multiple microservices and a frontend application:

```
microservices-2-ticketing/
├── auth/              # Authentication service (Express + TypeScript) ✅
├── tickets/           # Tickets CRUD service (Express + TypeScript) ✅
├── orders/            # Orders service with reservation logic ✅
├── expiration/        # Expiration service (Bull/Redis delayed jobs) ✅
├── payments/          # Payments service (Stripe) 🚧
├── client/            # React/Next.js frontend application 🚧
├── common/            # Git submodule → @charityx/common shared package ✅
├── nats-test/         # Local NATS Streaming sandbox/test scripts
├── infra/k8s/         # Kubernetes deployment manifests
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

The root `package.json` currently only declares `auth` as an npm workspace (the other services were added later and each manage their own `node_modules` independently). The other services (`tickets`, `orders`, `expiration`, `payments`) each manage their own `node_modules` via their own `package-lock.json`. The client is a standalone Next.js project.

```json
{
  "workspaces": [
    "auth"
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
- `.prettierrc` - Code formatting
- `.husky/` - Git hooks
- `tsconfig.json` - Base TypeScript config
- `eslint.config.js` - ESLint configuration

## 📝 Available Scripts

### Root Level (Monorepo)

```bash
# Development
npm run dev:auth             # Start auth service in dev mode

# Testing (auth workspace only — other services run tests from their own directory)
npm run test                 # Run tests in watch mode
npm run test:run             # Run tests once (CI mode)
npm run coverage             # Generate coverage reports

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

### Service Level (run from inside a service directory)

```bash
# Inside any service directory (auth/, tickets/, orders/, expiration/, payments/)
npm run dev                  # Dev server with hot reload
npm run start                # Run compiled build
npm run build                # Compile TypeScript
npm run test                 # Run tests (watch mode)
npm run test:run             # Run tests once
npm run lint                 # Check linting
npm run typecheck            # Check types
```

## 🔧 Services

### Auth Service ✅

**Purpose:** User authentication, JWT tokens, user management  
**Port:** 3000 (Kubernetes ClusterIP) / 3000 (local dev)  
**Location:** `/auth`

```bash
# Development
npm run dev:auth

# Testing
npm run test --workspace=auth

# Build Docker image
docker build -f auth/Dockerfile -t haryati75/auth:latest .
```

**Key Endpoints (all under `/api/users`):**
- `POST /api/users/signup` — Register a new user
- `POST /api/users/signin` — Login and receive a JWT session cookie
- `POST /api/users/signout` — Clear the session cookie
- `GET /api/users/currentuser` — Return the currently signed-in user (or `null`)
- `GET /api/users/` — List all users (dev/admin use)

---

### Tickets Service ✅

**Purpose:** Create, update, and list tickets for sale  
**Location:** `/tickets`

**Key Endpoints (all under `/api/tickets`):**
- `POST /api/tickets` — Create a new ticket (requires auth)
- `GET /api/tickets` — List all tickets
- `GET /api/tickets/:id` — Get a single ticket
- `PUT /api/tickets/:id` — Update a ticket (owner only; blocked if already reserved)

**Events Published:** `ticket:created`, `ticket:updated`  
**Events Consumed:** `order:created` (marks ticket reserved), `order:cancelled` (clears reservation)

---

### Orders Service ✅

**Purpose:** Create and manage ticket purchase orders  
**Location:** `/orders`

**Key Endpoints (all under `/api/orders`):**
- `POST /api/orders` — Reserve a ticket and create an order (requires auth)
- `GET /api/orders` — List all orders for the current user
- `GET /api/orders/:id` — Get a single order
- `DELETE /api/orders/:id` — Cancel an order (user-initiated)

**Events Published:** `order:created`, `order:cancelled`  
**Events Consumed:** `ticket:created`, `ticket:updated` (maintains local ticket replica), `expiration:complete` (auto-cancels expired orders)

---

### Expiration Service ✅

**Purpose:** Automatically cancel orders that are not paid within the reservation window (60 seconds)  
**Location:** `/expiration`

No HTTP endpoints. Runs a **Bull/Redis** delayed job queue:
1. Listens for `order:created` → enqueues a job with `delay = expiresAt − now`
2. When the job fires → publishes `expiration:complete { orderId }`

**Events Published:** `expiration:complete`  
**Events Consumed:** `order:created`

---

### Payments Service 🚧

**Purpose:** Process payments via Stripe and record charge receipts  
**Location:** `/payments`

**What is implemented:**
- `Order` replica model (mirrors orders service state via events)
- `OrderCreatedListener` — saves an order replica to the payments DB
- `OrderCancelledListener` — marks the local order replica as `cancelled`

**What still needs to be built:**
- `POST /api/payments` route — validate the charge against the local order replica and call Stripe
- `Payment` model — stores `{ orderId, stripeId }`
- `PaymentCreatedPublisher` — emits `payment:created` after a successful charge
- `payment:created` event contract in `@charityx/common`
- Kubernetes `STRIPE_KEY` secret and env var wiring

---

### Client (Next.js) 🚧

**Purpose:** React/Next.js frontend application (Pages Router)  
**Location:** `/client`

**What is implemented:**
- `_app.js` with Bootstrap CSS and shared `<Header>` component
- Landing page (`/`) — shows welcome message based on `currentUser`
- Sign-up page (`/auth/signup`)
- Sign-in page (`/auth/signin`)
- Sign-out page (`/auth/signout`)
- `use-request` hook — generic hook for API calls with error display
- `build-client` helper — constructs the right Axios base URL for server-side vs. client-side rendering

**What still needs to be built:**
- Tickets list page (`/tickets`) — fetch and display `GET /api/tickets`
- New ticket page (`/tickets/new`) — form to `POST /api/tickets`
- Individual ticket page (`/tickets/[ticketId]`) — show ticket + "Purchase" button
- Order confirmation page (`/orders/[orderId]`) — show order details + countdown timer
- Payment page — embed Stripe `react-stripe-checkout` and call `POST /api/payments`

---

### Shared Common Package (`@charityx/common`) ✅

**Location:** `common/` (Git submodule → [microservices-2-ticketing-common](https://github.com/haryati75/microservices-2-ticketing-common))  
**Published as:** `@charityx/common` on npm

Provides:
- `Subjects` enum — all NATS subject strings
- `Listener<T>` / `Publisher<T>` base classes
- Event interfaces — `TicketCreatedEvent`, `TicketUpdatedEvent`, `OrderCreatedEvent`, `OrderCancelledEvent`, `ExpirationCompleteEvent`
- `OrderStatus` enum
- Express middleware — `currentUser`, `requireAuth`, `errorHandler`, `validateRequest`
- Custom errors — `BadRequestError`, `NotFoundError`, `NotAuthorizedError`, `DatabaseConnectionError`

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
kubectl apply -f infra/k8s/

# Check deployment status
kubectl get pods
kubectl get svc

# View logs
kubectl logs -f deployment/auth-depl

# Port forward to local machine
kubectl port-forward svc/auth-svc 3001:3001

# Cleanup
kubectl delete -f infra/k8s/
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
# Copy infra/k8s/auth-depl.yaml and infra/k8s/auth-svc.yaml, rename for new service

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

### Windows Line Endings (CRLF vs LF)

When using Husky on Windows, ensure shell scripts and hooks use LF line endings:

```bash
# Recommended per-repo setting to avoid line-ending warnings
git config core.safecrlf false

# Optional global setting for Windows users
git config --global core.autocrlf input
```

This repository includes a `.gitattributes` that enforces LF for `.husky/**` and source files, so future clones should not hit CRLF issues. If you ever see `/usr/bin/env: 'sh\r': No such file or directory`, normalize Husky files:

```bash
find .husky -type f -print0 | xargs -0 sed -i 's/\r$//' 
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

## 🗺️ What's Next

The following items are the remaining steps to complete the course project:

### 1. Payments Service — complete the payment flow

- [ ] Add `payment:created` event contract to `@charityx/common` (subject + interface + export)
- [ ] Create a `Payment` Mongoose model (`{ orderId, stripeId }`)
- [ ] Build `POST /api/payments` route:
  - Authenticate the user
  - Look up the order replica in the payments DB and verify ownership + non-cancelled status
  - Call Stripe `charges.create` with the supplied `token`
  - Save a new `Payment` document
  - Publish `payment:created`
- [ ] Create `PaymentCreatedPublisher`
- [ ] Add `STRIPE_KEY` as a Kubernetes secret and wire it through the payments deployment YAML
- [ ] Write tests for the new route and publisher

### 2. Client — build the tickets, orders, and payment UI

- [ ] **Tickets list page** (`/tickets`) — fetch `GET /api/tickets` and render a table with a "View" link per ticket
- [ ] **New ticket page** (`/tickets/new`) — form with title + price; calls `POST /api/tickets`
- [ ] **Ticket detail page** (`/tickets/[ticketId]`) — show ticket details + "Purchase" button that calls `POST /api/orders`
- [ ] **Order confirmation page** (`/orders/[orderId]`) — show order status + countdown timer; render `<StripeCheckout>` when order is `created`
- [ ] **Stripe payment** — install `react-stripe-checkout`, call `POST /api/payments` on token, redirect to index on success

### 3. Optional polish

- [ ] Guard `ExpirationCompleteListener` against cancelling an already `complete` order (the guard is currently commented out — important once payments are live)
- [ ] Add `payment:created` listener to the orders service to mark the order `complete`
- [ ] Expand client header to show links to tickets list and "sell a ticket" depending on auth state

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found` | Run `npm install` at root and inside the affected service directory |
| Type errors | Run `npm run typecheck` inside the service |
| Linting errors | Run `npm run lint:fix` inside the service |
| Tests failing | Check `npm run test:run` output |
| Kubernetes 503 error | Check pod status: `kubectl get pods` and logs: `kubectl logs deployment/auth-depl` |
| Skaffold build fails | Verify Docker image name in `skaffold.yaml` matches service name |
| Port already in use | Change PORT env var or kill the conflicting process |
| Image not found in K8s | Build and push: `docker build -f auth/Dockerfile -t haryati75/auth:latest . && docker push haryati75/auth:latest` |
| `thisisunsafe` not working | This bypasses Chrome's certificate warning on `ticketing.dev`. Make sure you click anywhere on the Chrome warning page first, then type the phrase (it won't be visible as you type) |

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
kubectl delete -f infra/k8s/
kubectl apply -f infra/k8s/

# View all resources
kubectl get all
```

#### Publish Common Package to npm

If you make changes to the shared `@charityx/common` package:
1. Update version in `common/package.json`
2. Login to npm: `npm login`
3. Build: `npm run build` (inside `common/`)
4. Publish: `npm publish --access public`
5. Update the `@charityx/common` version in each affected service's `package.json` and re-run `npm install`


## 📖 Learning Resources

- [Stephen Grider's Microservices Course](https://www.udemy.com/course/microservices-with-node-js-and-react/)
- [Express Documentation](https://expressjs.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

MIT

## 👤 Author

Haryati Hassan

## 🙏 Acknowledgments

Based on Stephen Grider's "Microservices with Node JS and React" Udemy course.
