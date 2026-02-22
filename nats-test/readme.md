
# nats-test

Small sandbox project from Stephen Grider’s microservices course for testing NATS Streaming (STAN) locally.

It contains:
- A publisher script that connects to a NATS Streaming server and can publish an example event.
- A listener script placeholder (currently empty) where you can add a subscription.

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
- To actually publish an event, uncomment the example `stan.publish(...)` code in `src/publisher.ts`.
- Each connection must use a unique client ID. The publisher currently uses `abc`; if you implement the listener, use a different client ID there.

