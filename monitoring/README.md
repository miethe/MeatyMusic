# MeatyMusic Security Monitoring System

This directory contains the complete monitoring and alerting infrastructure for the MeatyMusic security architecture, implementing production-ready observability for security boundaries, authentication, and RLS performance.

## Architecture Overview

The monitoring system provides comprehensive observability for:

- **Security Boundary Violations** - Detection and alerting for RLS policy bypasses
- **Authentication Failures** - Monitoring of auth attempts and failure patterns
- **Security Query Performance** - RLS overhead and query duration tracking
- **Context Management** - Security context creation and validation monitoring
- **Resource Utilization** - Memory, CPU, and database connection tracking

## Directory Structure

```
monitoring/
├── dashboards/security/           # Grafana dashboard configurations
│   ├── security-overview.json     # Main security monitoring dashboard
│   └── performance-metrics.json   # Security performance metrics dashboard
├── alerts/                        # Prometheus alert rules
│   └── security-rules.yml         # Comprehensive security alerting rules
├── scripts/                       # Automation and setup scripts
│   ├── security-monitoring-setup.py    # Automated deployment script
│   ├── metrics-simulator.py            # Development metrics simulator
│   └── documentation-validator.py      # Doc validation automation
├── grafana/                       # Grafana configuration
│   └── provisioning/              # Auto-provisioning configs
├── config.yml                     # Main monitoring configuration
├── docker-compose.yml             # Local development stack
├── prometheus.yml                 # Prometheus scraping configuration
├── alertmanager.yml               # Alert routing and notification config
└── README.md                     # This file
```

## Quick Start

### 1. Local Development Setup

Start the complete monitoring stack locally:

```bash
# Start the monitoring stack
cd monitoring/
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f grafana prometheus

# Access the services
open http://localhost:3000  # Grafana (admin/meatymusic_admin)
open http://localhost:9090  # Prometheus
open http://localhost:9093  # AlertManager
```

### 2. Deploy Monitoring Configuration

Use the automated setup script to deploy dashboards and alerts:

```bash
# Validate configuration
python scripts/security-monitoring-setup.py --validate-only

# Setup everything
python scripts/security-monitoring-setup.py --setup-all

# Setup specific components
python scripts/security-monitoring-setup.py --setup-dashboards
python scripts/security-monitoring-setup.py --setup-alerts

# Run health checks
python scripts/security-monitoring-setup.py --health-checks
```

### 3. Production Deployment

For production deployment, configure environment variables:

```bash
# Grafana configuration
export GRAFANA_URL="https://grafana.meatymusic.com"
export GRAFANA_ADMIN_USER="admin"
export GRAFANA_ADMIN_PASSWORD="secure_password"

# Prometheus configuration
export PROMETHEUS_URL="https://prometheus.meatymusic.com"
export PROMETHEUS_RULES_DIR="/etc/prometheus/rules"

# Alert configuration
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export PAGERDUTY_SERVICE_KEY="your_pagerduty_key"

# Deploy with production config
python scripts/security-monitoring-setup.py \
  --setup-all \
  --environment production \
  --config monitoring/config.yml
```

## Dashboards

### Security Overview Dashboard
- **Security Boundary Violations** - Real-time violation detection and trends
- **Authentication Failures** - Auth failure rates and method distribution
- **Active Security Contexts** - Current context usage and health
- **RLS Policy Effectiveness** - Coverage percentage and application rates
- **Security Query Performance** - Query duration percentiles and outliers

Key metrics visualized:
- `meatymusic_security_boundary_violations_total`
- `meatymusic_auth_failures_total`
- `meatymusic_security_contexts_active`
- `meatymusic_rls_policy_applied_total`

### Performance Metrics Dashboard
- **Query Duration Distribution** - Histogram of security query performance
- **RLS Overhead Tracking** - Performance impact of row-level security
- **Database Function Performance** - Security function execution times
- **Memory and Resource Usage** - Resource consumption by security components
- **Cache Performance** - Security cache hit rates and effectiveness

Key metrics visualized:
- `meatymusic_security_query_duration_seconds`
- `meatymusic_rls_overhead_seconds`
- `meatymusic_security_memory_usage_bytes`
- `meatymusic_security_cache_hits_total`

## Alert Rules

### Critical Alerts
- **SecurityBoundaryViolationCritical** - More than 10 violations/sec (1min threshold)
- **CriticalAuthenticationFailureRate** - More than 100 failures/sec (1min threshold)
- **RLSCoverageDropped** - RLS coverage below 95% (5min threshold)

### Warning Alerts
- **SecurityBoundaryViolationHigh** - More than 1 violation/sec (2min threshold)
- **HighAuthenticationFailureRate** - More than 20 failures/sec (2min threshold)
- **SecurityPerformanceDegradation** - P95 query time > 2s (5min threshold)
- **RLSOverheadHigh** - RLS overhead P95 > 0.5s (3min threshold)

### Informational Alerts
- **AuthMethodAnomalous** - Unusual auth method distribution (5min threshold)
- **SecurityCachePerformancePoor** - Cache hit rate < 70% (5min threshold)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GRAFANA_URL` | Grafana instance URL | `http://localhost:3000` |
| `PROMETHEUS_URL` | Prometheus instance URL | `http://localhost:9090` |
| `SLACK_WEBHOOK_URL` | Slack webhook for alerts | - |
| `PAGERDUTY_SERVICE_KEY` | PagerDuty integration key | - |
| `ENVIRONMENT` | Deployment environment | `development` |

### Metric Configuration

The monitoring system expects the following metrics from the MeatyMusic API:

#### Security Boundary Metrics
```python
# Security boundary violations
meatymusic_security_boundary_violations_total{violation_type, table_name, user_id, instance}

# Authentication metrics
meatymusic_auth_failures_total{auth_method, failure_reason, instance}
meatymusic_auth_attempts_total{auth_method, instance}
```

#### Performance Metrics
```python
# Query performance
meatymusic_security_query_duration_seconds{query_type, table_name, instance}

# RLS overhead
meatymusic_rls_overhead_seconds{operation_type, instance}

# Context performance
meatymusic_security_context_creation_duration_seconds{instance}
meatymusic_security_context_validation_duration_seconds{instance}
```

#### Resource Metrics
```python
# Memory usage
meatymusic_security_memory_usage_bytes{component, instance}

# Database connections
meatymusic_db_pool_connections_active{instance}
meatymusic_db_pool_connections_idle{instance}
```

## Development and Testing

### Using the Metrics Simulator

For development and testing, use the included metrics simulator:

```bash
# Start the simulator
python monitoring/scripts/metrics-simulator.py

# Or use Docker
docker-compose up metrics-simulator

# Access metrics
curl http://localhost:8001/metrics
```

The simulator generates realistic security metrics including:
- Periodic security boundary violations
- Authentication failure patterns
- Query performance variations
- Resource usage fluctuations
- Cache performance metrics

### Testing Alert Rules

Test alert rules using the simulator:

```bash
# Start monitoring stack
docker-compose up -d

# Wait for metrics to be scraped
sleep 30

# Check alert status in Prometheus
open http://localhost:9090/alerts

# View alerts in AlertManager
open http://localhost:9093/#/alerts
```

### Documentation Validation

Validate monitoring documentation and configurations:

```bash
# Validate all documentation
python scripts/documentation-validator.py --validate-all

# Check specific components
python scripts/documentation-validator.py --check-code-examples
python scripts/documentation-validator.py --check-links

# Update metrics documentation
python scripts/documentation-validator.py --update-metrics
```

## Troubleshooting

### Common Issues

#### Metrics Not Appearing
1. Check that the API service is exposing metrics:
   ```bash
   curl http://localhost:8000/metrics
   ```

2. Verify Prometheus scraping configuration:
   ```bash
   # Check targets in Prometheus
   open http://localhost:9090/targets
   ```

3. Check service discovery:
   ```bash
   docker-compose logs prometheus
   ```

#### Dashboards Not Loading
1. Check Grafana data source configuration:
   ```bash
   docker-compose logs grafana
   ```

2. Verify dashboard provisioning:
   ```bash
   # Check if dashboards are provisioned
   curl -H "Content-Type: application/json" \
        http://admin:meatymusic_admin@localhost:3000/api/search
   ```

#### Alerts Not Firing
1. Check alert rule syntax:
   ```bash
   # Validate rules using promtool
   promtool check rules monitoring/alerts/security-rules.yml
   ```

2. Test alert expressions:
   ```bash
   # Test in Prometheus UI
   open http://localhost:9090/graph
   ```

3. Check AlertManager configuration:
   ```bash
   docker-compose logs alertmanager
   ```

### Log Analysis

View logs for specific services:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs grafana
docker-compose logs prometheus
docker-compose logs alertmanager

# Follow logs
docker-compose logs -f prometheus
```

### Performance Tuning

#### Prometheus Performance
- Adjust scrape intervals in `prometheus.yml`
- Configure retention periods based on storage capacity
- Use recording rules for frequently queried metrics

#### Grafana Performance
- Enable caching for dashboard queries
- Use query result caching for expensive queries
- Optimize dashboard queries using recording rules

## Integration with MeatyMusic

### API Service Integration

The monitoring system integrates with the MeatyMusic API service through:

1. **Metrics Endpoint** - `/metrics` endpoint exposing Prometheus metrics
2. **OpenTelemetry Integration** - Trace correlation with monitoring data
3. **Structured Logging** - JSON logs with trace and span correlation
4. **Health Checks** - Monitoring system validates API service health

### Security Architecture Integration

The monitoring aligns with the MeatyMusic security architecture:

1. **RLS Monitoring** - Tracks row-level security policy effectiveness
2. **Context Validation** - Monitors security context creation and validation
3. **Boundary Protection** - Detects and alerts on security boundary violations
4. **Performance Impact** - Measures security overhead on application performance

### CI/CD Integration

Integrate monitoring setup into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Validate Monitoring Configuration
  run: |
    python scripts/security-monitoring-setup.py --validate-only
    python scripts/documentation-validator.py --validate-all

- name: Deploy Monitoring (Production)
  if: github.ref == 'refs/heads/main'
  run: |
    python scripts/security-monitoring-setup.py --setup-all --environment production
```

## Security Considerations

### Sensitive Data Protection
- Metric labels avoid exposing sensitive information
- Authentication credentials stored in secure environment variables
- TLS enabled for production deployments

### Access Control
- Grafana authentication required for dashboard access
- Prometheus API access restricted by network policies
- AlertManager notifications use encrypted channels

### Compliance
- Audit logging enabled for all monitoring activities
- Data retention policies configured per compliance requirements
- Alert notifications include compliance-relevant context

## Additional Resources

- [MeatyMusic Security Architecture Documentation](../docs/security/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboard Design Guide](https://grafana.com/docs/grafana/latest/best-practices/)
- [AlertManager Configuration Reference](https://prometheus.io/docs/alerting/latest/configuration/)

## Contributing

When contributing to the monitoring system:

1. **Test Changes** - Use the local Docker stack to validate changes
2. **Validate Configuration** - Run validation scripts before committing
3. **Update Documentation** - Keep this README and inline docs current
4. **Security Review** - Ensure changes don't expose sensitive information

## License

This monitoring configuration is part of the MeatyMusic project and follows the same licensing terms.
