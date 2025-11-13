#!/usr/bin/env python3
"""
MeatyMusic Security Metrics Simulator

This script simulates security metrics for testing and development of the
monitoring system. It generates realistic metric values that match the
expected patterns from the actual MeatyMusic security architecture.

Usage:
    python scripts/metrics-simulator.py
    # Access metrics at http://localhost:8000/metrics
"""

import asyncio
import random
import time
from typing import Dict, List
import uvicorn
from fastapi import FastAPI
from prometheus_client import (
    Counter, Histogram, Gauge, CollectorRegistry,
    make_asgi_app, CONTENT_TYPE_LATEST
)

# Create custom registry for metrics
registry = CollectorRegistry()

# Security boundary violation metrics
security_violations = Counter(
    'meatymusic_security_boundary_violations_total',
    'Total number of security boundary violations detected',
    labelnames=['violation_type', 'table_name', 'user_id', 'instance'],
    registry=registry
)

# Authentication failure metrics
auth_failures = Counter(
    'meatymusic_auth_failures_total',
    'Total number of authentication failures',
    labelnames=['auth_method', 'failure_reason', 'instance'],
    registry=registry
)

# Authentication attempt metrics
auth_attempts = Counter(
    'meatymusic_auth_attempts_total',
    'Total number of authentication attempts',
    labelnames=['auth_method', 'instance'],
    registry=registry
)

# Security query duration metrics
security_query_duration = Histogram(
    'meatymusic_security_query_duration_seconds',
    'Duration of security-related database queries',
    labelnames=['query_type', 'table_name', 'instance'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
    registry=registry
)

# RLS policy application metrics
rls_policy_applied = Counter(
    'meatymusic_rls_policy_applied_total',
    'Total number of RLS policies applied to queries',
    labelnames=['table_name', 'policy_name', 'instance'],
    registry=registry
)

# Database queries total (for coverage calculation)
db_queries_total = Counter(
    'meatymusic_db_queries_total',
    'Total number of database queries executed',
    labelnames=['instance'],
    registry=registry
)

# Active security contexts
security_contexts_active = Gauge(
    'meatymusic_security_contexts_active',
    'Number of active security contexts',
    labelnames=['context_type', 'instance'],
    registry=registry
)

# Security context creation metrics
security_context_created = Counter(
    'meatymusic_security_context_created_total',
    'Total number of security contexts created',
    labelnames=['instance'],
    registry=registry
)

# Security context validation errors
security_context_validation_errors = Counter(
    'meatymusic_security_context_validation_errors_total',
    'Total number of security context validation errors',
    labelnames=['error_type', 'instance'],
    registry=registry
)

# Security context creation duration
security_context_creation_duration = Histogram(
    'meatymusic_security_context_creation_duration_seconds',
    'Duration of security context creation',
    labelnames=['instance'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
    registry=registry
)

# Security context validation duration
security_context_validation_duration = Histogram(
    'meatymusic_security_context_validation_duration_seconds',
    'Duration of security context validation',
    labelnames=['instance'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
    registry=registry
)

# RLS overhead metrics
rls_overhead = Histogram(
    'meatymusic_rls_overhead_seconds',
    'Overhead introduced by RLS policies',
    labelnames=['operation_type', 'instance'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
    registry=registry
)

# Security memory usage
security_memory_usage = Gauge(
    'meatymusic_security_memory_usage_bytes',
    'Memory usage by security components',
    labelnames=['component', 'instance'],
    registry=registry
)

# Security cache metrics
security_cache_hits = Counter(
    'meatymusic_security_cache_hits_total',
    'Total number of security cache hits',
    labelnames=['instance'],
    registry=registry
)

security_cache_requests = Counter(
    'meatymusic_security_cache_requests_total',
    'Total number of security cache requests',
    labelnames=['instance'],
    registry=registry
)

# Database security function duration
db_security_function_duration = Gauge(
    'meatymusic_db_security_function_duration_seconds',
    'Duration of database security functions',
    labelnames=['function_name', 'instance'],
    registry=registry
)

# Database connection pool metrics
db_pool_connections_active = Gauge(
    'meatymusic_db_pool_connections_active',
    'Number of active database connections',
    labelnames=['instance'],
    registry=registry
)

db_pool_connections_idle = Gauge(
    'meatymusic_db_pool_connections_idle',
    'Number of idle database connections',
    labelnames=['instance'],
    registry=registry
)

# RLS policy compilation duration
rls_policy_compilation = Histogram(
    'meatymusic_rls_policy_compilation_seconds',
    'Duration of RLS policy compilation',
    labelnames=['instance'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
    registry=registry
)

# Security validation failures
security_validation_failures = Counter(
    'meatymusic_security_validation_failures_total',
    'Total number of security validation failures',
    labelnames=['endpoint', 'validation_type', 'instance'],
    registry=registry
)

# RLS policy failures
rls_policy_failures = Counter(
    'meatymusic_rls_policy_failures_total',
    'Total number of RLS policy failures',
    labelnames=['table_name', 'policy_name', 'instance'],
    registry=registry
)

# Security queries total
security_queries_total = Counter(
    'meatymusic_security_queries_total',
    'Total number of security queries executed',
    labelnames=['query_type', 'instance'],
    registry=registry
)

class SecurityMetricsSimulator:
    """Simulates realistic security metrics for development and testing."""

    def __init__(self):
        self.instance = "simulator-001"
        self.running = False

        # Simulation parameters
        self.tables = ['prompts', 'users', 'organizations', 'api_keys', 'sessions']
        self.policies = ['user_owned', 'org_member', 'tenant_isolation', 'admin_only']
        self.auth_methods = ['clerk_jwt', 'api_key', 'oauth2']
        self.violation_types = ['unauthorized_access', 'policy_bypass', 'privilege_escalation']
        self.query_types = ['select', 'insert', 'update', 'delete']
        self.security_functions = ['check_user_access', 'validate_rls_policy', 'audit_log_entry']
        self.endpoints = ['/api/v1/prompts', '/api/v1/users', '/api/v1/orgs']

        # State for realistic simulation
        self.active_users = random.randint(50, 200)
        self.base_qps = random.uniform(10, 50)

    async def start_simulation(self):
        """Start the metrics simulation."""
        self.running = True
        print(f"Starting security metrics simulation for instance: {self.instance}")

        while self.running:
            try:
                await self._simulate_normal_operations()
                await self._simulate_security_events()
                await self._update_gauge_metrics()
                await asyncio.sleep(1)  # Update every second

            except Exception as e:
                print(f"Error in simulation: {e}")
                await asyncio.sleep(5)

    async def _simulate_normal_operations(self):
        """Simulate normal application operations with security metrics."""

        # Simulate authentication attempts
        auth_success_rate = random.uniform(0.85, 0.98)
        auth_attempts_per_sec = random.uniform(1, 5)

        for _ in range(int(auth_attempts_per_sec)):
            method = random.choice(self.auth_methods)
            auth_attempts.labels(auth_method=method, instance=self.instance).inc()

            if random.random() > auth_success_rate:
                failure_reason = random.choice(['invalid_token', 'expired_token', 'invalid_credentials'])
                auth_failures.labels(
                    auth_method=method,
                    failure_reason=failure_reason,
                    instance=self.instance
                ).inc()

        # Simulate database queries with RLS
        query_rate = random.uniform(self.base_qps * 0.8, self.base_qps * 1.2)
        rls_coverage = random.uniform(0.92, 0.99)

        for _ in range(int(query_rate)):
            table = random.choice(self.tables)
            query_type = random.choice(self.query_types)

            # Record database query
            db_queries_total.labels(instance=self.instance).inc()

            # Simulate query duration
            duration = random.lognormvariate(-3, 0.5)  # Log-normal distribution
            security_query_duration.labels(
                query_type=query_type,
                table_name=table,
                instance=self.instance
            ).observe(duration)

            # Apply RLS policy (based on coverage rate)
            if random.random() < rls_coverage:
                policy = random.choice(self.policies)
                rls_policy_applied.labels(
                    table_name=table,
                    policy_name=policy,
                    instance=self.instance
                ).inc()

                # Simulate RLS overhead
                overhead = random.uniform(0.001, 0.01)
                rls_overhead.labels(
                    operation_type=query_type,
                    instance=self.instance
                ).observe(overhead)

            # Record security query
            security_queries_total.labels(
                query_type=query_type,
                instance=self.instance
            ).inc()

        # Simulate security context operations
        context_ops_per_sec = random.uniform(2, 8)
        for _ in range(int(context_ops_per_sec)):
            # Context creation
            creation_duration = random.uniform(0.005, 0.05)
            security_context_creation_duration.labels(instance=self.instance).observe(creation_duration)
            security_context_created.labels(instance=self.instance).inc()

            # Context validation
            validation_duration = random.uniform(0.001, 0.02)
            security_context_validation_duration.labels(instance=self.instance).observe(validation_duration)

            # Occasional validation errors
            if random.random() < 0.05:  # 5% error rate
                error_type = random.choice(['invalid_signature', 'expired_context', 'missing_claims'])
                security_context_validation_errors.labels(
                    error_type=error_type,
                    instance=self.instance
                ).inc()

        # Simulate cache operations
        cache_ops_per_sec = random.uniform(10, 30)
        cache_hit_rate = random.uniform(0.75, 0.95)

        for _ in range(int(cache_ops_per_sec)):
            security_cache_requests.labels(instance=self.instance).inc()

            if random.random() < cache_hit_rate:
                security_cache_hits.labels(instance=self.instance).inc()

    async def _simulate_security_events(self):
        """Simulate security events and violations."""

        # Simulate boundary violations (should be rare)
        violation_probability = random.uniform(0.0001, 0.001)  # Very low probability

        if random.random() < violation_probability:
            violation_type = random.choice(self.violation_types)
            table = random.choice(self.tables)
            user_id = f"user_{random.randint(1, 1000)}"

            security_violations.labels(
                violation_type=violation_type,
                table_name=table,
                user_id=user_id,
                instance=self.instance
            ).inc()

            print(f"⚠️  Simulated security violation: {violation_type} on {table}")

        # Simulate RLS policy failures (very rare)
        if random.random() < 0.0005:
            table = random.choice(self.tables)
            policy = random.choice(self.policies)

            rls_policy_failures.labels(
                table_name=table,
                policy_name=policy,
                instance=self.instance
            ).inc()

            print(f"🚨 Simulated RLS policy failure: {policy} on {table}")

        # Simulate security validation failures
        validation_failure_rate = random.uniform(0.01, 0.05)

        if random.random() < validation_failure_rate:
            endpoint = random.choice(self.endpoints)
            validation_type = random.choice(['access_control', 'rate_limiting', 'input_validation'])

            security_validation_failures.labels(
                endpoint=endpoint,
                validation_type=validation_type,
                instance=self.instance
            ).inc()

        # Simulate policy compilation (periodic)
        if random.random() < 0.1:  # 10% chance per second
            compilation_duration = random.uniform(0.01, 0.1)
            rls_policy_compilation.labels(instance=self.instance).observe(compilation_duration)

    async def _update_gauge_metrics(self):
        """Update gauge metrics that represent current state."""

        # Update active security contexts
        jwt_contexts = random.randint(self.active_users * 1, self.active_users * 3)
        session_contexts = random.randint(int(self.active_users * 0.8), int(self.active_users * 1.2))

        security_contexts_active.labels(context_type='jwt', instance=self.instance).set(jwt_contexts)
        security_contexts_active.labels(context_type='session', instance=self.instance).set(session_contexts)

        # Update memory usage
        for component in ['auth_cache', 'policy_engine', 'context_manager']:
            usage = random.uniform(50_000_000, 200_000_000)  # 50-200 MB
            security_memory_usage.labels(component=component, instance=self.instance).set(usage)

        # Update database security function durations
        for func in self.security_functions:
            duration = random.uniform(0.001, 0.05)
            db_security_function_duration.labels(function_name=func, instance=self.instance).set(duration)

        # Update connection pool metrics
        active_connections = random.randint(5, 25)
        idle_connections = random.randint(15, 35)

        db_pool_connections_active.labels(instance=self.instance).set(active_connections)
        db_pool_connections_idle.labels(instance=self.instance).set(idle_connections)

    def stop_simulation(self):
        """Stop the metrics simulation."""
        self.running = False
        print("Stopping security metrics simulation")

# FastAPI application
app = FastAPI(title="MeatyMusic Metrics Simulator")
simulator = SecurityMetricsSimulator()

# Add Prometheus metrics endpoint
metrics_app = make_asgi_app(registry)
app.mount("/metrics", metrics_app)

@app.on_event("startup")
async def startup_event():
    """Start the metrics simulation on application startup."""
    asyncio.create_task(simulator.start_simulation())

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the metrics simulation on application shutdown."""
    simulator.stop_simulation()

@app.get("/")
async def root():
    """Root endpoint with information about the simulator."""
    return {
        "service": "MeatyMusic Security Metrics Simulator",
        "version": "1.0.0",
        "instance": simulator.instance,
        "endpoints": {
            "metrics": "/metrics",
            "health": "/health"
        },
        "simulation_status": "running" if simulator.running else "stopped"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "simulation_running": simulator.running
    }

if __name__ == "__main__":
    print("Starting MeatyMusic Security Metrics Simulator...")
    print("Metrics will be available at http://localhost:8000/metrics")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
