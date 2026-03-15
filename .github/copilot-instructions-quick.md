# Copilot Quick Checklist: Events

Use this as a fast pre-commit checklist for event work in tickets, orders, and expiration.

## 1) Contract First (common repo)

- Update subject in common/src/events/subjects.ts if needed.
- Add or update interface in common/src/events/*-event.ts.
- Export from common/src/index.ts.
- Keep payload additive and backward compatible.

## 2) Publisher Rules

- Extend Publisher<T> from @charityx/common.
- Use shared Subjects enum only.
- Publish after DB save succeeds.
- Include version for versioned entities.

## 3) Listener Rules

- Extend Listener<T> from @charityx/common.
- Keep queueGroupName stable per service.
- Ack only after all side effects complete.
- Throw on processing errors to allow redelivery.

## 4) Versioning Rules

- Use optimisticConcurrency and version key consistency.
- For ordered updates, query by previous version (version - 1).
- Do not ack skipped/out-of-order version events.

## 5) Critical Orders Replica Rule

- In orders ticket:updated handling, always persist:
  - title
  - price
  - orderId (set on reserve, clear on unreserve)
- Missing orderId persistence can cause version drift and later findByEvent failures.

## 6) Expiration Path Expectations

- expiration publishes expiration:complete.
- orders cancels and publishes order:cancelled.
- tickets clears orderId and publishes ticket:updated.
- orders consumes ticket:updated and advances replica version.

## 7) Update Dependencies After Common Changes

- Publish/update @charityx/common.
- Bump dependency versions in affected services.
- Install and run targeted tests.

## 8) Tests To Run

- Listener success + ack.
- Listener skipped-version no-ack.
- Publisher subject and payload shape.
- Reserve/unreserve orderId + version progression.
- Expiration to cancellation to unreserve chain.

## 9) Docs To Update

- Update EVENTS.md when subjects, payloads, ordering, or lifecycle flow changes.
