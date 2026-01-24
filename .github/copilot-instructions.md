# AI Copilot Instructions: Microservices Ticketing App

## Architecture Overview

**Monorepo microservices platform** using Express.js (TypeScript) services with Next.js frontend and Kubernetes orchestration.

**Current services:**
- **auth/**: Authentication service with JWT-based session management, MongoDB user storage, cookie-session middleware
- **client/**: React/Next.js frontend  
- **Future services**: tickets, orders, payments (structure TBD, but follow auth service pattern)

**Service boundaries**: Each service is independently deployable; auth service handles user authentication across the platform. Services communicate via HTTP (future: event-driven architecture with message queues).

## Development Workflow

### Running Locally
```bash
npm run dev:auth                    # Single service development  
skaffold dev                        # Full k8s cluster with all services (preferred)
npm run test                        # Run all tests across workspaces
npm run test:run                    # Run tests in CI mode (no watch)
npm run lint:fix && npm run format  # Fix linting and formatting
```

**Key requirement:** Before `skaffold dev`, ensure `JWT_KEY` secret exists: `kubectl create secret generic jwt-secret --from-literal=JWT_KEY=test_key`

### Kubernetes/Skaffold Details
- **Ingress host**: `ticketing.dev` (add to `/etc/hosts` for local dev)
- **Skaffold syncing**: Hot-reload enabled for `src/**/*.ts` (auth) and `**/*.js` (client)
- **Port forwarding needed**: MongoDB exposed on `localhost:27018` via `kubectl port-forward svc/auth-mongo-srv 27018:27017`

## Code Patterns & Conventions

### Error Handling
**Custom error hierarchy** (required for consistency):
1. Extend `CustomError` abstract base class (see [auth/src/errors/custom-error.ts](auth/src/errors/custom-error.ts))
2. Implement required properties: `statusCode` and `serializeErrors()` method
3. Specific error classes: `BadRequestError`, `NotAuthorizedError`, `NotFoundError`, `DatabaseConnectionError`, `RequestValidationError`
4. Central error handler middleware catches `CustomError` instances; unknown errors return 500

**Example**: [BadRequestError](auth/src/errors/bad-request-error.ts) pattern.

### Request Validation
Use `express-validator` + custom middleware:
```typescript
// In route handlers:
router.post('/', 
  [body('email').isEmail(), body('password').isLength({min: 4})],
  validateRequest,  // Throws RequestValidationError if invalid
  async (req, res) => { /* handler */ }
);
```

See [validateRequest middleware](auth/src/middlewares/validate-request.ts) — it throws, letting error handler catch it.

### Authentication Middleware
- **Current**: JWT stored in cookie-session; `currentUser` middleware decodes JWT from session
- **Pattern**: Add `requireAuth` middleware to protected routes (see [auth/src/middlewares/require-auth.ts](auth/src/middlewares/require-auth.ts))
- Extract user from `req.currentUser` property (set by middleware)

### Mongoose Schema Design
- **Build pattern**: Static `build(attrs)` method on model (not constructor) for type safety — see [User model](auth/src/models/user.ts)
- **toJSON transform**: Centralize serialization in schema `toJSON` config to hide sensitive fields (password) and normalize ID
- **Password hashing**: Use `pre('save')` hooks for pre-save middleware (implement in password service)

### Route Structure
- Mount sub-routers at `/api/[resource]` 
- Each route file (`signup.ts`, `signin.ts`, etc.) exports a router with single or multiple HTTP methods
- Parent router aggregates in [routes/index.ts](auth/src/routes/index.ts)

## Testing Strategy

### Test Framework
- **Vitest** with MongoDB Memory Server for isolated tests (no external DB)
- Tests live in `__test__/` directory next to implementation files
- Global setup/teardown configured in [vitest.config.ts](auth/vitest.config.ts)

### Testing Patterns
1. **API integration tests**: Use `supertest` to make HTTP requests to app
   ```typescript
   import request from 'supertest';
   import { app } from '../../app.js';
   
   it('returns 201 on successful signup', async () => {
     return request(app)
       .post('/api/users/signup')
       .send({ email: 'test@test.com', password: 'password' })
       .expect(201);
   });
   ```

2. **Global helper**: `global.signin()` creates authenticated session for protected route testing (defined in [tests/setup.ts](auth/src/tests/setup.ts))

3. **Test isolation**: `beforeEach` clears all collections; each test starts fresh

### Running Tests
```bash
npm run test          # Watch mode, dev experience
npm run test:run      # CI mode (single run)
npm run coverage      # Coverage report with v8 provider
```

## TypeScript & Build

### Configuration
- **ES modules** (type: "module" in package.json) — use `.js` extensions in imports
- **Build target**: Node 24 (via `@tsconfig/node24`)
- **Development**: `tsx watch` for hot-reload without build step
- **Production build**: `tsc -p tsconfig.build.json` → `dist/` output

### Key patterns
- No `@` path aliases yet; use relative imports (`../models/user.js`)
- Strict type checking enabled; avoid `any`

## Code Quality Tools

### Linting & Formatting
- **ESLint 9** (flat config in [eslint.config.js](eslint.config.js))
- **Prettier** for formatting
- **Husky** + **lint-staged** enforce checks pre-commit

### Commands
```bash
npm run lint            # Check all
npm run lint:fix        # Auto-fix
npm run format          # Prettier
npm run typecheck       # tsc check
```

## New Service Setup Template

When creating a new service (tickets, orders, etc.):
1. Create `[service]/` folder with `package.json` (same structure as auth)
2. Add to root `package.json` workspaces array
3. Implement `app.ts` (Express setup), error classes, middleware, routes
4. Add `Dockerfile` and K8s deployment manifest in `infra/k8s/`
5. Add Skaffold artifact config for hot-reload
6. Tests in `__test__/` with Vitest + MongoDB Memory Server setup

**Reference**: [auth service](auth/) is the template.

## Important Notes

- **JWT_KEY required**: Tests set via env; k8s cluster requires secret for production
- **Node 24+**: Uses native ES modules and optional chaining
- **Async errors**: Error handler catches synchronous throws; wrap async handlers in try-catch or use wrapper (Express 5 handles async by default)
- **Cross-service communication**: Not yet implemented — plan async messaging/events
