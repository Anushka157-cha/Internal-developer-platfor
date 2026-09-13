# APM & Monitoring Integration Notes

Quick integration suggestions you can add to the backend for production observability.

1) Sentry (errors / traces)

Install:

```bash
npm install @sentry/node @sentry/integrations
```

Basic init (in `main.ts`):

```ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

Consider adding the Sentry request/transaction integrations and a global exception filter.

2) Prometheus (metrics)

Install: `npm install prom-client` or use `nestjs-prom` integrations.

Basic example:

```ts
import * as client from 'prom-client';
client.collectDefaultMetrics();
// expose /metrics endpoint that returns client.register.metrics()
```

3) Tracing

- For distributed tracing, evaluate Jaeger or Zipkin with `opentelemetry-js` and `@opentelemetry/instrumentation` packages.

Notes
- Keep sampling and DSNs configurable via environment variables.
- Add alerts (Sentry, PagerDuty) and dashboards (Grafana) in your production runbooks.
