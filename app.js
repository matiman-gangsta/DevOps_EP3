const express = require('express');
const promClient = require('prom-client');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable default metrics collection (includes CPU/memory)
promClient.collectDefaultMetrics();

// Define custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const testCoverageGauge = new promClient.Gauge({
  name: 'app_test_coverage_percent',
  help: 'Test coverage percentage from the latest CI run'
});

const deploymentDurationGauge = new promClient.Gauge({
  name: 'app_deployment_duration_seconds',
  help: 'Deployment build duration in seconds from the latest CI run'
});

// Load metadata metrics on startup
try {
  const metadataPath = path.join(__dirname, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (metadata.test_coverage_percent !== undefined) {
      testCoverageGauge.set(metadata.test_coverage_percent);
    }
    if (metadata.deployment_duration_seconds !== undefined) {
      deploymentDurationGauge.set(metadata.deployment_duration_seconds);
    }
  } else {
    testCoverageGauge.set(0);
    deploymentDurationGauge.set(0);
  }
} catch (e) {
  console.error('Error reading metadata.json:', e);
  testCoverageGauge.set(0);
  deploymentDurationGauge.set(0);
}

// Middleware to monitor request count
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.path !== '/metrics' && req.path !== '/health') {
      const route = req.route ? req.route.path : req.path;
      httpRequestsTotal.inc({ method: req.method, route: route || req.path, status: res.statusCode });
    }
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: "Bienvenido al Microservicio de ejemplo DevOps",
    version: "1.1.0",
    status: "Operativo",
    author: "Matias Nazal"
  });
});

app.get('/version', (req, res) => {
    res.json({ version: "1.0.0", env: "Development" });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = { app, server };