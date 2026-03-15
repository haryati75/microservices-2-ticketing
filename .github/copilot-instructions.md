# Copilot Instructions: Event-Driven Changes

For a concise maintenance checklist, see copilot-instructions-quick.md.

Use these rules when creating or maintaining event listeners, publishers, and shared event contracts in this project.

## Scope

This repository has event-producing and event-consuming services:

- tickets
- orders
- expiration

Shared contracts and base abstractions are in the separate common package repo (`microservices-2-ticketing-common`) and are consumed as `@charityx/common`.

## Source Of Truth

- Event subjects and payload interfaces are defined in `common/src/events` in the common repo.
- Service code must not invent local event payload shapes that differ from common contracts.
- Update contracts in common first, then update service implementations.

## Event Design Rules

When adding a new event or changing an existing one:

1. Add or update the subject in `common/src/events/subjects.ts`.
2. Add or update the event interface in `common/src/events/*-event.ts`.
3. Export updates from `common/src/index.ts`.
4. Keep payloads minimal but complete for consumer behavior.
5. Treat payload fields as contract-stable once published.
6. Prefer additive changes; avoid breaking/renaming fields without migration.

## Publisher Rules

- Each publisher must extend `Publisher<T>` from `@charityx/common`.
- `subject` must be one of the shared `Subjects` enum values.
- Publish only after database state is successfully persisted.
- Include the document `version` for versioned entities (ticket/order).
- Do not ack or suppress publish failures silently.

## Listener Rules

- Each listener must extend `Listener<T>` from `@charityx/common`.
- Set a service-specific queue group name and keep it stable.
- Use `msg.ack()` only after all side effects are complete.
- Throw on processing errors so NATS can redeliver.
- For versioned entities, load with version-aware lookup (for example `findByEvent` using `version - 1` in Orders ticket replica).

## Versioning And Concurrency

- Use optimistic concurrency (`optimisticConcurrency: true`) on versioned models.
- Maintain a `version` field (`versionKey = 'version'`) consistently.
- Consumers applying ordered updates must enforce contiguous versions.
- If an event is out of order, do not ack.

## Orders Ticket Replica Rule (Critical)

In Orders, `ticket:updated` handling must persist all replica-relevant fields, including:

- `title`
- `price`
- `orderId` (set on reservation, cleared on unreservation)

Do not ignore reservation-only changes. If `orderId` is not persisted, replica version can drift and break later `findByEvent` checks (for example during expiration cancellation flow).

## Expiration And Cancellation Rule

- `expiration` publishes `expiration:complete` when Bull delay expires.
- `orders` listener cancels the order and publishes `order:cancelled`.
- `tickets` listener clears `orderId` and publishes `ticket:updated`.
- `orders` ticket replica must consume that `ticket:updated` and advance version.

## Common Repo Update Workflow

When changing event contracts or base classes:

1. Implement and test changes in `microservices-2-ticketing-common`.
2. Build/publish a new `@charityx/common` version.
3. Update `@charityx/common` dependency version in each affected service `package.json`.
4. Install dependencies in affected services.
5. Run service tests and targeted listener/publisher tests.
6. Update project docs (`EVENTS.md`) if event flow or payload changed.

## Testing Checklist For Event Changes

- Listener success path updates DB state and acks.
- Listener rejects skipped version events and does not ack.
- Publisher emits expected subject and payload.
- Reservation/unreservation transitions update `orderId` and `version` correctly.
- Expiration flow leads to cancellation and ticket unreservation.

## Documentation Checklist

Update `EVENTS.md` when any of the following change:

- subjects
- payload fields
- sequence/ownership of publish-listen responsibilities
- version progression assumptions
- cancellation/expiration behavior

## Coding Conventions

- Keep event handlers small and deterministic.
- Log with service/event context for traceability.
- Avoid side effects before entity existence checks.
- Keep comments focused on distributed-systems intent (ordering, retries, idempotency).
