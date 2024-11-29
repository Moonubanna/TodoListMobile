import 'react-native-get-random-values';
import { Resource } from '@opentelemetry/resources';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Enable debugging for OpenTelemetry
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Create resources for the app
const resource = new Resource({
  'service.name': 'TodoApp', // Service name
  'service.version': '1.0.0',
  'environment': 'development', // Environment (e.g., development or production)
  'service.instance.id': `${Math.random().toString(36).substring(2)}`, // Unique instance ID
});

// Configure tracing
const tracerProvider = new WebTracerProvider({
  resource,
});

// Add span processor and OTLP trace exporter
tracerProvider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: 'http://localhost:4317/v1/traces', // Update with your OTEL collector's trace endpoint
    })
  )
);

// Configure metrics with an exporter
const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4317/v1/metrics', // Update with your OTEL collector's metrics endpoint
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 5000, // Export metrics every 5 seconds
});

const meterProvider = new MeterProvider({
  resource,
});

// Add the metric reader to the provider (this is where it "starts" collecting metrics)
meterProvider.addMetricReader(metricReader);

// Initialize OpenTelemetry
export const initTelemetry = () => {
  try {
    // Register tracing provider
    tracerProvider.register();
    console.log('Tracing provider registered');

    // No explicit "start" needed for the MeterProvider; it automatically begins collecting metrics
    console.log('Metrics provider initialized and running');
  } catch (error) {
    console.error('Error initializing telemetry:', error);
  }
};