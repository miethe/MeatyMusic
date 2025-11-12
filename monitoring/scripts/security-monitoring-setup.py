#!/usr/bin/env python3
"""
Security Monitoring System Setup Script

This script automates the deployment and configuration of the MeatyMusic
security monitoring infrastructure, including Grafana dashboards, Prometheus
alert rules, and monitoring system validation.

Usage:
    python scripts/security-monitoring-setup.py --config monitoring/config.yml
    python scripts/security-monitoring-setup.py --validate-only
    python scripts/security-monitoring-setup.py --setup-all --environment production

Features:
- Automated dashboard provisioning to Grafana
- Prometheus alert rule deployment
- Metric endpoint configuration and validation
- Health check implementation
- Monitoring system integration testing
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import yaml
import requests
import subprocess
from urllib.parse import urljoin
from datetime import datetime, timezone

# Third-party imports
try:
    import prometheus_client
    from grafana_api import GrafanaApi
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Install with: pip install prometheus-client grafana-api")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('monitoring-setup.log')
    ]
)
logger = logging.getLogger(__name__)

class MonitoringSetupError(Exception):
    """Custom exception for monitoring setup failures."""
    pass

class SecurityMonitoringSetup:
    """Main class for setting up the security monitoring infrastructure."""

    def __init__(self, config_file: Optional[str] = None):
        """Initialize the monitoring setup with configuration."""
        self.config = self._load_config(config_file)
        self.project_root = Path(__file__).parent.parent
        self.monitoring_dir = self.project_root / "monitoring"

        # Initialize API clients
        self.grafana_api = None
        self.prometheus_url = None
        self._setup_clients()

    def _load_config(self, config_file: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file or environment variables."""
        config = {
            'grafana': {
                'url': os.getenv('GRAFANA_URL', 'http://localhost:3000'),
                'admin_user': os.getenv('GRAFANA_ADMIN_USER', 'admin'),
                'admin_password': os.getenv('GRAFANA_ADMIN_PASSWORD', 'admin'),
                'org_id': int(os.getenv('GRAFANA_ORG_ID', '1'))
            },
            'prometheus': {
                'url': os.getenv('PROMETHEUS_URL', 'http://localhost:9090'),
                'rules_dir': os.getenv('PROMETHEUS_RULES_DIR', '/etc/prometheus/rules'),
                'config_reload_url': os.getenv('PROMETHEUS_RELOAD_URL', 'http://localhost:9090/-/reload')
            },
            'metrics': {
                'namespace': 'meatymusic',
                'endpoints': [
                    'http://localhost:8000/metrics',  # API service
                ],
                'timeout': 30
            },
            'alerts': {
                'webhook_url': os.getenv('ALERT_WEBHOOK_URL'),
                'slack_channel': os.getenv('ALERT_SLACK_CHANNEL', '#alerts'),
                'pager_duty_key': os.getenv('PAGERDUTY_INTEGRATION_KEY')
            }
        }

        if config_file and os.path.exists(config_file):
            with open(config_file, 'r') as f:
                file_config = yaml.safe_load(f)
                config.update(file_config)

        return config

    def _setup_clients(self):
        """Initialize API clients for Grafana and Prometheus."""
        try:
            self.grafana_api = GrafanaApi(
                (self.config['grafana']['admin_user'], self.config['grafana']['admin_password']),
                host=self.config['grafana']['url'],
                org_id=self.config['grafana']['org_id']
            )
            self.prometheus_url = self.config['prometheus']['url']
            logger.info("API clients initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize API clients: {e}")
            raise MonitoringSetupError(f"Client initialization failed: {e}")

    def setup_dashboards(self) -> bool:
        """Deploy Grafana dashboards from configuration files."""
        logger.info("Setting up Grafana dashboards...")

        dashboards_dir = self.monitoring_dir / "dashboards" / "security"
        dashboard_files = list(dashboards_dir.glob("*.json"))

        if not dashboard_files:
            logger.warning("No dashboard files found in monitoring/dashboards/security/")
            return False

        success_count = 0
        for dashboard_file in dashboard_files:
            try:
                with open(dashboard_file, 'r') as f:
                    dashboard_data = json.load(f)

                # Prepare dashboard for import
                dashboard_payload = {
                    "dashboard": dashboard_data.get("dashboard", dashboard_data),
                    "overwrite": True,
                    "folderId": self._get_or_create_folder("Security")
                }

                response = self.grafana_api.dashboard.update_dashboard(dashboard_payload)

                if response.get('status') == 'success':
                    logger.info(f"Successfully deployed dashboard: {dashboard_file.name}")
                    success_count += 1
                else:
                    logger.error(f"Failed to deploy dashboard {dashboard_file.name}: {response}")

            except Exception as e:
                logger.error(f"Error deploying dashboard {dashboard_file.name}: {e}")

        logger.info(f"Dashboard deployment complete: {success_count}/{len(dashboard_files)} successful")
        return success_count == len(dashboard_files)

    def _get_or_create_folder(self, folder_name: str) -> int:
        """Get or create a Grafana folder and return its ID."""
        try:
            folders = self.grafana_api.folder.get_all_folders()
            for folder in folders:
                if folder['title'] == folder_name:
                    return folder['id']

            # Create folder if it doesn't exist
            new_folder = self.grafana_api.folder.create_folder(
                title=folder_name,
                uid=folder_name.lower().replace(' ', '-')
            )
            return new_folder['id']

        except Exception as e:
            logger.warning(f"Could not manage folder {folder_name}: {e}")
            return 0  # Use general folder

    def setup_alert_rules(self) -> bool:
        """Deploy Prometheus alert rules."""
        logger.info("Setting up Prometheus alert rules...")

        alert_rules_file = self.monitoring_dir / "alerts" / "security-rules.yml"

        if not alert_rules_file.exists():
            logger.error(f"Alert rules file not found: {alert_rules_file}")
            return False

        try:
            # Validate alert rules syntax
            if not self._validate_alert_rules(alert_rules_file):
                return False

            # Copy rules to Prometheus rules directory
            rules_dest = Path(self.config['prometheus']['rules_dir']) / "meatymusic-security.yml"

            if self._copy_rules_file(alert_rules_file, rules_dest):
                # Reload Prometheus configuration
                if self._reload_prometheus_config():
                    logger.info("Alert rules deployed and Prometheus reloaded successfully")
                    return True
                else:
                    logger.error("Failed to reload Prometheus configuration")
                    return False
            else:
                return False

        except Exception as e:
            logger.error(f"Error setting up alert rules: {e}")
            return False

    def _validate_alert_rules(self, rules_file: Path) -> bool:
        """Validate Prometheus alert rules syntax using promtool."""
        try:
            result = subprocess.run(
                ['promtool', 'check', 'rules', str(rules_file)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                logger.info("Alert rules validation passed")
                return True
            else:
                logger.error(f"Alert rules validation failed: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            logger.error("Alert rules validation timed out")
            return False
        except FileNotFoundError:
            logger.warning("promtool not found, skipping validation")
            return True  # Continue without validation
        except Exception as e:
            logger.error(f"Error validating alert rules: {e}")
            return False

    def _copy_rules_file(self, source: Path, destination: Path) -> bool:
        """Copy alert rules file to Prometheus rules directory."""
        try:
            destination.parent.mkdir(parents=True, exist_ok=True)

            with open(source, 'r') as src, open(destination, 'w') as dst:
                dst.write(src.read())

            logger.info(f"Alert rules copied to {destination}")
            return True

        except PermissionError:
            logger.error(f"Permission denied writing to {destination}")
            logger.info("Consider running with appropriate permissions or updating PROMETHEUS_RULES_DIR")
            return False
        except Exception as e:
            logger.error(f"Failed to copy rules file: {e}")
            return False

    def _reload_prometheus_config(self) -> bool:
        """Reload Prometheus configuration."""
        try:
            response = requests.post(
                self.config['prometheus']['config_reload_url'],
                timeout=10
            )

            if response.status_code == 200:
                logger.info("Prometheus configuration reloaded successfully")
                return True
            else:
                logger.error(f"Failed to reload Prometheus config: HTTP {response.status_code}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"Error reloading Prometheus config: {e}")
            return False

    def setup_metric_endpoints(self) -> bool:
        """Configure and validate metric collection endpoints."""
        logger.info("Setting up metric collection endpoints...")

        success_count = 0
        for endpoint in self.config['metrics']['endpoints']:
            if self._validate_metric_endpoint(endpoint):
                success_count += 1

        logger.info(f"Metric endpoints validated: {success_count}/{len(self.config['metrics']['endpoints'])}")
        return success_count > 0

    def _validate_metric_endpoint(self, endpoint: str) -> bool:
        """Validate that a metric endpoint is accessible and returns valid metrics."""
        try:
            response = requests.get(endpoint, timeout=self.config['metrics']['timeout'])

            if response.status_code != 200:
                logger.error(f"Metric endpoint {endpoint} returned HTTP {response.status_code}")
                return False

            # Basic validation of Prometheus metrics format
            content = response.text
            if '# HELP' in content or '# TYPE' in content:
                logger.info(f"Metric endpoint {endpoint} is accessible and valid")
                return True
            else:
                logger.warning(f"Metric endpoint {endpoint} doesn't appear to contain Prometheus metrics")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to access metric endpoint {endpoint}: {e}")
            return False

    def run_health_checks(self) -> Dict[str, bool]:
        """Run comprehensive health checks on the monitoring system."""
        logger.info("Running monitoring system health checks...")

        health_status = {
            'grafana_connection': self._check_grafana_health(),
            'prometheus_connection': self._check_prometheus_health(),
            'dashboards_accessible': self._check_dashboards_health(),
            'alert_rules_loaded': self._check_alert_rules_health(),
            'metric_collection': self._check_metrics_collection(),
            'security_metrics_present': self._check_security_metrics()
        }

        # Log health check results
        for check, status in health_status.items():
            status_str = "✓ PASS" if status else "✗ FAIL"
            logger.info(f"Health check {check}: {status_str}")

        return health_status

    def _check_grafana_health(self) -> bool:
        """Check Grafana API connectivity and health."""
        try:
            health = self.grafana_api.health.check()
            return health.get('database') == 'ok'
        except Exception as e:
            logger.error(f"Grafana health check failed: {e}")
            return False

    def _check_prometheus_health(self) -> bool:
        """Check Prometheus API connectivity and health."""
        try:
            response = requests.get(f"{self.prometheus_url}/-/healthy", timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Prometheus health check failed: {e}")
            return False

    def _check_dashboards_health(self) -> bool:
        """Check that security dashboards are accessible."""
        try:
            dashboards = self.grafana_api.search.search_dashboards(tag="security")
            return len(dashboards) > 0
        except Exception as e:
            logger.error(f"Dashboard health check failed: {e}")
            return False

    def _check_alert_rules_health(self) -> bool:
        """Check that alert rules are loaded in Prometheus."""
        try:
            response = requests.get(f"{self.prometheus_url}/api/v1/rules", timeout=10)
            if response.status_code != 200:
                return False

            rules_data = response.json()
            for group in rules_data.get('data', {}).get('groups', []):
                if group.get('name', '').startswith('meatymusic.security'):
                    return True

            return False

        except Exception as e:
            logger.error(f"Alert rules health check failed: {e}")
            return False

    def _check_metrics_collection(self) -> bool:
        """Check that metrics are being collected successfully."""
        try:
            response = requests.get(
                f"{self.prometheus_url}/api/v1/query",
                params={"query": "up"},
                timeout=10
            )

            if response.status_code != 200:
                return False

            data = response.json()
            return data.get('status') == 'success' and len(data.get('data', {}).get('result', [])) > 0

        except Exception as e:
            logger.error(f"Metrics collection health check failed: {e}")
            return False

    def _check_security_metrics(self) -> bool:
        """Check that security-specific metrics are present."""
        security_metrics = [
            'meatymusic_security_boundary_violations_total',
            'meatymusic_auth_failures_total',
            'meatymusic_security_query_duration_seconds'
        ]

        present_metrics = 0
        for metric in security_metrics:
            try:
                response = requests.get(
                    f"{self.prometheus_url}/api/v1/query",
                    params={"query": metric},
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        present_metrics += 1

            except Exception as e:
                logger.debug(f"Error checking metric {metric}: {e}")

        success_rate = present_metrics / len(security_metrics)
        logger.info(f"Security metrics present: {present_metrics}/{len(security_metrics)} ({success_rate:.1%})")

        return success_rate >= 0.5  # At least 50% of expected metrics should be present

    def validate_configuration(self) -> bool:
        """Validate the monitoring system configuration without deploying."""
        logger.info("Validating monitoring configuration...")

        validation_results = {
            'config_files_exist': self._validate_config_files(),
            'dashboard_syntax': self._validate_dashboard_syntax(),
            'alert_rules_syntax': self._validate_alert_rules_syntax(),
            'endpoint_accessibility': self._validate_endpoint_accessibility()
        }

        all_valid = all(validation_results.values())

        for check, result in validation_results.items():
            status = "✓ VALID" if result else "✗ INVALID"
            logger.info(f"Configuration validation {check}: {status}")

        return all_valid

    def _validate_config_files(self) -> bool:
        """Check that all required configuration files exist."""
        required_files = [
            self.monitoring_dir / "dashboards" / "security" / "security-overview.json",
            self.monitoring_dir / "dashboards" / "security" / "performance-metrics.json",
            self.monitoring_dir / "alerts" / "security-rules.yml"
        ]

        for file_path in required_files:
            if not file_path.exists():
                logger.error(f"Required file not found: {file_path}")
                return False

        return True

    def _validate_dashboard_syntax(self) -> bool:
        """Validate JSON syntax of dashboard files."""
        dashboard_dir = self.monitoring_dir / "dashboards" / "security"

        for dashboard_file in dashboard_dir.glob("*.json"):
            try:
                with open(dashboard_file, 'r') as f:
                    json.load(f)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in dashboard {dashboard_file.name}: {e}")
                return False

        return True

    def _validate_alert_rules_syntax(self) -> bool:
        """Validate YAML syntax of alert rules."""
        rules_file = self.monitoring_dir / "alerts" / "security-rules.yml"

        try:
            with open(rules_file, 'r') as f:
                yaml.safe_load(f)
            return True
        except yaml.YAMLError as e:
            logger.error(f"Invalid YAML in alert rules: {e}")
            return False

    def _validate_endpoint_accessibility(self) -> bool:
        """Validate that monitoring endpoints are accessible."""
        try:
            # Check Grafana
            response = requests.get(self.config['grafana']['url'], timeout=5)
            if response.status_code != 200:
                logger.error(f"Grafana not accessible at {self.config['grafana']['url']}")
                return False
        except Exception:
            logger.error("Grafana endpoint not accessible")
            return False

        try:
            # Check Prometheus
            response = requests.get(self.config['prometheus']['url'], timeout=5)
            if response.status_code != 200:
                logger.error(f"Prometheus not accessible at {self.config['prometheus']['url']}")
                return False
        except Exception:
            logger.error("Prometheus endpoint not accessible")
            return False

        return True

    def setup_all(self) -> bool:
        """Run complete monitoring system setup."""
        logger.info("Starting complete monitoring system setup...")

        # Validation first
        if not self.validate_configuration():
            logger.error("Configuration validation failed, aborting setup")
            return False

        setup_results = {
            'dashboards': self.setup_dashboards(),
            'alert_rules': self.setup_alert_rules(),
            'metric_endpoints': self.setup_metric_endpoints()
        }

        success_count = sum(setup_results.values())
        total_count = len(setup_results)

        logger.info(f"Setup completed: {success_count}/{total_count} components successful")

        if success_count == total_count:
            logger.info("Running post-setup health checks...")
            health_status = self.run_health_checks()

            if all(health_status.values()):
                logger.info("✓ Monitoring system setup completed successfully!")
                return True
            else:
                logger.warning("⚠ Setup completed but health checks failed")
                return False
        else:
            logger.error("✗ Setup failed for some components")
            return False

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Setup MeatyMusic security monitoring infrastructure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/security-monitoring-setup.py --setup-all
  python scripts/security-monitoring-setup.py --validate-only
  python scripts/security-monitoring-setup.py --config monitoring/config.yml --setup-dashboards
  python scripts/security-monitoring-setup.py --health-checks
        """
    )

    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--environment', default='development',
                       choices=['development', 'staging', 'production'],
                       help='Target environment')

    # Setup options
    parser.add_argument('--setup-all', action='store_true',
                       help='Run complete monitoring system setup')
    parser.add_argument('--setup-dashboards', action='store_true',
                       help='Setup Grafana dashboards only')
    parser.add_argument('--setup-alerts', action='store_true',
                       help='Setup Prometheus alert rules only')
    parser.add_argument('--setup-metrics', action='store_true',
                       help='Setup metric collection endpoints only')

    # Validation and testing
    parser.add_argument('--validate-only', action='store_true',
                       help='Validate configuration without deploying')
    parser.add_argument('--health-checks', action='store_true',
                       help='Run health checks on existing monitoring setup')

    # Output options
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--quiet', '-q', action='store_true',
                       help='Suppress non-error output')

    args = parser.parse_args()

    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger().setLevel(logging.ERROR)

    try:
        # Initialize setup handler
        setup = SecurityMonitoringSetup(args.config)

        # Determine what to run
        if args.validate_only:
            success = setup.validate_configuration()
        elif args.health_checks:
            health_status = setup.run_health_checks()
            success = all(health_status.values())
        elif args.setup_all:
            success = setup.setup_all()
        elif args.setup_dashboards:
            success = setup.setup_dashboards()
        elif args.setup_alerts:
            success = setup.setup_alert_rules()
        elif args.setup_metrics:
            success = setup.setup_metric_endpoints()
        else:
            # Default to validation
            success = setup.validate_configuration()

        if success:
            logger.info("Operation completed successfully!")
            sys.exit(0)
        else:
            logger.error("Operation failed!")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        sys.exit(130)
    except MonitoringSetupError as e:
        logger.error(f"Setup error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        if args.verbose:
            logger.exception("Full traceback:")
        sys.exit(1)

if __name__ == '__main__':
    main()
