# Production Deployment Guide

This guide covers advanced production deployment scenarios beyond the local Docker Desktop template setup.

## 📋 Table of Contents

- [Container Image Registry](#container-image-registry) - Push images to Docker Hub, ECR, GCR
- [Kubernetes Production Setup](#kubernetes-production-setup) - Production K8s clusters
- [Namespace Isolation](#namespace-isolation) - Separate environments
- [Auto-Scaling](#auto-scaling) - Handle variable load
- [Health Checks](#health-checks) - Liveness and readiness probes
- [Ingress Configuration](#ingress-configuration) - Advanced routing
- [Secrets Management](#secrets-management) - Secure sensitive data
- [Monitoring & Logging](#monitoring--logging) - Observe your application
- [Environment-Specific Configs](#environment-specific-configs) - Multi-environment setup

## 🐳 Container Image Registry

Push your Docker image to a container registry for production deployment.

### Docker Hub

```bash
# Tag image for Docker Hub
docker tag express-ts:latest <your-username>/express-ts:v1.0.0
docker tag express-ts:latest <your-username>/express-ts:latest

# Login to Docker Hub
docker login

# Push images
docker push <your-username>/express-ts:v1.0.0
docker push <your-username>/express-ts:latest

# Use in K8s deployment
# Change image in deployment.yaml to:
# image: <your-username>/express-ts:v1.0.0
```

### AWS ECR (Elastic Container Registry)

```bash
# Create repository
aws ecr create-repository --repository-name express-ts --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag express-ts:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/express-ts:v1.0.0

# Push
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/express-ts:v1.0.0

# Use in K8s deployment
# image: <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/express-ts:v1.0.0
```

### Google Container Registry (GCR)

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Tag image
docker tag express-ts:latest gcr.io/<gcp-project>/express-ts:v1.0.0

# Push
docker push gcr.io/<gcp-project>/express-ts:v1.0.0

# Use in K8s deployment
# image: gcr.io/<gcp-project>/express-ts:v1.0.0
```

## ☸️ Kubernetes Production Setup

### Production Deployment Configuration

```yaml
# k8s/deployment-prod.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: express-ts
  namespace: production
  labels:
    app: express-ts
    environment: production
spec:
  replicas: 3  # Run multiple replicas for high availability
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: express-ts
  template:
    metadata:
      labels:
        app: express-ts
        environment: production
    spec:
      containers:
      - name: express-ts
        image: <registry>/express-ts:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3001"
        - name: LOG_LEVEL
          value: info
        envFrom:
        - configMapRef:
            name: express-ts-config
        - secretRef:
            name: express-ts-secrets
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

### Deploy to Production

```bash
# Create production namespace
kubectl create namespace production

# Apply ConfigMap for non-sensitive config
kubectl apply -f k8s/configmap-prod.yaml -n production

# Apply Secrets for sensitive data
kubectl apply -f k8s/secrets-prod.yaml -n production

# Deploy
kubectl apply -f k8s/deployment-prod.yaml -n production
kubectl apply -f k8s/service-prod.yaml -n production

# Monitor rollout
kubectl rollout status deployment/express-ts -n production

# Check pods
kubectl get pods -n production
```

## 🔒 Namespace Isolation

Keep different environments separate with Kubernetes namespaces.

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    team: platform
```

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Set as default for commands
kubectl config set-context --current --namespace=production

# Verify
kubectl get namespace
```

## 📈 Auto-Scaling

Automatically scale replicas based on CPU and memory usage.

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: express-ts-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: express-ts
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

```bash
# Apply HPA
kubectl apply -f k8s/hpa.yaml

# Watch scaling in action
kubectl get hpa express-ts-hpa -n production --watch

# View HPA status
kubectl describe hpa express-ts-hpa -n production
```

## 🏥 Health Checks

Implement health checks for better reliability.

### Add Health Endpoint to Your API

```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
```

```typescript
// src/index.ts
import express from 'express';
import healthRouter from './routes/health.js';

export const app = express();

app.use(express.json());
app.use('/', healthRouter);

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

### Liveness & Readiness Probes

Already configured in the production deployment YAML above. They check the `/health` endpoint to determine if the pod should:
- **Liveness:** Be restarted if it's no longer responsive
- **Readiness:** Receive traffic if it's ready to handle requests

## 🚦 Ingress Configuration

Use Ingress for advanced routing and load balancing.

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: express-ts-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: express-ts-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: express-ts
            port:
              number: 3001
```

```bash
# Install NGINX Ingress Controller (if not already installed)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace

# Apply Ingress
kubectl apply -f k8s/ingress.yaml

# Get Ingress IP/hostname
kubectl get ingress -n production
```

## 🔐 Secrets Management

Store sensitive data securely using Kubernetes Secrets.

### Create Secrets

```bash
# From command line
kubectl create secret generic express-ts-secrets \
  --from-literal=DATABASE_URL=postgresql://user:pass@host:5432/db \
  --from-literal=API_KEY=your-secret-key \
  -n production

# Or from file
kubectl create secret generic express-ts-secrets \
  --from-file=.env.prod \
  -n production
```

### Reference in Deployment

Secrets are referenced in the deployment YAML via `envFrom.secretRef`:

```yaml
envFrom:
- secretRef:
    name: express-ts-secrets
```

### Using External Secret Manager

For production, consider using external secret managers:

```yaml
# Using AWS Secrets Manager with External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: express-ts-secrets
  namespace: production
spec:
  refreshInterval: 15m
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: express-ts-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: prod/express-ts/db-url
  - secretKey: API_KEY
    remoteRef:
      key: prod/express-ts/api-key
```

## 📊 Monitoring & Logging

### Prometheus Metrics

```typescript
// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';

interface MetricsData {
  requests: number;
  errors: number;
  avgResponseTime: number;
}

let metricsData: MetricsData = {
  requests: 0,
  errors: 0,
  avgResponseTime: 0,
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsData.requests++;
    if (res.statusCode >= 400) {
      metricsData.errors++;
    }
    metricsData.avgResponseTime = (metricsData.avgResponseTime + duration) / 2;
  });

  next();
};

export const getMetrics = () => {
  return {
    requests_total: metricsData.requests,
    errors_total: metricsData.errors,
    avg_response_time_ms: Math.round(metricsData.avgResponseTime),
  };
};
```

### Structured Logging

```typescript
// src/utils/logger.ts
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const log = (level: LogLevel, message: string, data?: Record<string, any>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }));
};

export const logger = {
  debug: (message: string, data?: Record<string, any>) => log(LogLevel.DEBUG, message, data),
  info: (message: string, data?: Record<string, any>) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: Record<string, any>) => log(LogLevel.WARN, message, data),
  error: (message: string, data?: Record<string, any>) => log(LogLevel.ERROR, message, data),
};
```

### Monitoring Stack with Helm

```bash
# Install Prometheus + Grafana stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Username: admin, Password: prom-operator
```

## 🏗️ Environment-Specific Configs

### ConfigMap for Non-Sensitive Configuration

```yaml
# k8s/configmap-prod.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: express-ts-config
  namespace: production
data:
  LOG_LEVEL: "info"
  NODE_ENV: "production"
  CACHE_TTL: "3600"
  MAX_CONNECTIONS: "100"
```

### Different Configs per Environment

```bash
# Development
kubectl create configmap express-ts-config \
  --from-literal=LOG_LEVEL=debug \
  --from-literal=NODE_ENV=development \
  -n development

# Staging
kubectl create configmap express-ts-config \
  --from-literal=LOG_LEVEL=info \
  --from-literal=NODE_ENV=staging \
  -n staging

# Production
kubectl create configmap express-ts-config \
  --from-literal=LOG_LEVEL=warn \
  --from-literal=NODE_ENV=production \
  -n production
```

## 🚀 Production Deployment Checklist

- [ ] Push image to container registry (Docker Hub, ECR, GCR)
- [ ] Create production namespace
- [ ] Implement and test health check endpoint (`/health`)
- [ ] Create Secrets for sensitive data (database URLs, API keys)
- [ ] Create ConfigMaps for environment-specific config
- [ ] Deploy with multiple replicas (3+)
- [ ] Configure Horizontal Pod Autoscaler (HPA)
- [ ] Set up Ingress for domain-based routing
- [ ] Enable TLS/SSL certificates
- [ ] Configure monitoring (Prometheus + Grafana)
- [ ] Set up structured logging
- [ ] Configure alerting rules
- [ ] Set up log aggregation (ELK, Datadog, etc.)
- [ ] Document runbooks for common issues
- [ ] Test disaster recovery procedures
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Implement request tracing (Jaeger, Zipkin)

## 📚 Additional Resources

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Helm Documentation](https://helm.sh/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cert Manager](https://cert-manager.io/)
- [External Secrets Operator](https://external-secrets.io/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
