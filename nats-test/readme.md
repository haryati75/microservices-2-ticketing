
# nats-test

Small sandbox project from Stephen Grider’s microservices course for testing NATS Streaming (STAN) locally.

It contains:
- A publisher script that connects to a NATS Streaming server and can publish an example event.
- A listener script that subscribes to `ticket:created` and logs/acks messages.

Note: STAN is deprecated in favor of NATS JetStream, but this project is meant for testing STAN specifically as used in the course.

TODO: update to JetStream in the future.

## Prerequisites

- Node.js + npm
- A running NATS Streaming server with cluster ID `ticketing`

## Start NATS Streaming locally

### Option A: Docker (recommended)

Run the same image/args used by this repo’s Kubernetes manifest:

```bash
docker run --rm \
	-p 4222:4222 \
	-p 8222:8222 \
	nats-streaming:0.17.0 \
	-p 4222 -m 8222 -hbi 5s -hbt 5s -hbf 2 -SD -cid ticketing
```

Optional monitoring endpoint: `http://localhost:8222`.

Useful endpoints for monitoring:
- `http://localhost:8222/streaming/channelsz` - shows all channels
- `http://localhost:8222/streaming/subscriptionsz` - shows all subscriptions

### Option B: Kubernetes (this repo)

```bash
kubectl apply -f infra/k8s/nats-depl.yaml
kubectl port-forward svc/nats-srv 4222:4222 8222:8222
```

## Run the scripts

Install deps:

```bash
cd nats-test
npm install
```

Start the publisher (watch mode):

```bash
npm run publish
```

Start the listener (watch mode):

```bash
npm run listen
```

## Notes

- The publisher connects to `http://localhost:4222` with cluster ID `ticketing` (see `src/publisher.ts`).
- The publisher publishes a sample `ticket:created` event on connect (see `src/publisher.ts`).
- Each connection must use a unique client ID. The publisher currently uses `abc`; if you implement the listener, use a different client ID there.

### Listener subscription options (STAN)

The listener in `src/listener.ts` uses NATS Streaming (STAN) subscription options that control delivery semantics. These are important if you want “at least once” processing and safe restarts.

- `setManualAckMode(true)`
	- Disables auto-ack.
	- The listener must call `msg.ack()` after successfully processing the message.
	- If the listener crashes before acking, STAN will re-deliver the message.

- `setDeliverAllAvailable()`
	- On first start, delivers all historical messages on the channel/subject (not only new ones).
	- Useful for local testing because you can restart the listener and still see previously published events (depending on durable state).

- `setDurableName('accounting-service')`
	- Makes the subscription durable.
	- STAN tracks the last acknowledged sequence for this durable name, so if the listener goes offline and comes back, it can resume from where it left off.
	- Changing the durable name is effectively creating a new “cursor” (you may see older messages again).

- Queue group: `stan.subscribe('ticket:created', 'queue-group-name', options)`
	- When multiple listener instances use the same queue group, only one of them receives each message (load balancing).
	- Different queue group names each get their own copy of messages.

### Concurrency + reliability patterns (and how these options help)

In event-driven microservices, “concurrency issues” usually mean one of these:

1) **Duplicate processing** (same event handled more than once)
2) **Lost work on crash/restart** (a message was delivered, but the service died mid-processing)
3) **Scaling a single service** (multiple instances should share the load without all doing the same work)
4) **Catching up safely** (a service comes online after being down and must process what it missed)

Common patterns used to address these problems:

- **Competing consumers / worker pool**: many instances share a single logical subscription.
- **At-least-once delivery + idempotent handlers**: assume duplicates can happen; make handlers safe to run twice.
- **Explicit acknowledgements**: only mark work “done” after it really completes.
- **Durable consumer state**: persist where the service left off so restarts don’t skip messages.
- **Replay/catch-up**: allow a new service (or a wiped DB) to rebuild state from the event log.

How the listener’s STAN options map to those patterns:

- Queue group (`queue-group-name`)
	- Implements the **competing consumers** pattern.
	- With multiple listener pods/instances, only one instance processes each event, preventing “every instance does the same work”.
	- This is the main knob for **horizontal scaling** while keeping per-event work single-threaded across the fleet.

- `setManualAckMode(true)` + calling `msg.ack()`
	- Implements **explicit acknowledgements**.
	- Prevents marking a message as handled until after your business logic completes.
	- If a process crashes mid-handler, the message is re-delivered (good for reliability), but it means you must expect duplicates.
	- Pair with **idempotent processing** (for example: check if an event ID/sequence was already applied, or use optimistic concurrency/version checks in your DB writes).

- `setDurableName('accounting-service')`
	- Implements **durable consumer state** (a persisted “cursor”).
	- Ensures restarts resume from the last acked message for that durable name, rather than starting over or missing gaps.
	- Important when you scale with queue groups: whichever instance is up next can continue the shared durable subscription.

- `setDeliverAllAvailable()`
	- Implements **replay/catch-up**.
	- Helpful for local development and for brand-new services that need to rebuild state.
	- With a durable name, it mainly affects the very first time the durable is created; after that, the durable cursor determines where to resume.

### Listener connection + shutdown

- The listener connects to the NATS server at `http://localhost:4222` with cluster ID `ticketing`.
- It registers `SIGINT`/`SIGTERM` handlers and calls `stan.close()` so STAN can cleanly close the connection before the process exits.

