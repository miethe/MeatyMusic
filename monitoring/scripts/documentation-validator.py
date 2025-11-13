#!/usr/bin/env python3
"""
Documentation Validation Script

This script validates the MeatyMusic security documentation for accuracy,
completeness, and maintenance. It checks code examples, validates links,
ensures documentation completeness, and provides automated updates.

Usage:
    python scripts/documentation-validator.py --validate-all
    python scripts/documentation-validator.py --check-code-examples
    python scripts/documentation-validator.py --check-links
    python scripts/documentation-validator.py --update-metrics

Features:
- Code example validation and testing
- Link checking and validation
- Documentation completeness verification
- Automated content updates and maintenance
- Integration with CI/CD pipelines
"""

import argparse
import ast
import json
import logging
import os
import re
import sys
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from urllib.parse import urljoin, urlparse
import yaml

# Third-party imports
try:
    import requests
    from bs4 import BeautifulSoup
    from markdown import markdown
    import markdownify
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Install with: pip install requests beautifulsoup4 markdown markdownify")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('documentation-validation.log')
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Results from a validation check."""
    check_type: str
    file_path: str
    status: str  # 'pass', 'fail', 'warning'
    message: str
    details: Optional[Dict[str, Any]] = None

@dataclass
class CodeExample:
    """Represents a code example found in documentation."""
    file_path: str
    language: str
    code: str
    line_number: int
    context: str

@dataclass
class LinkCheck:
    """Represents a link validation result."""
    url: str
    status_code: Optional[int]
    is_valid: bool
    error_message: Optional[str]
    source_file: str
    line_number: int

class DocumentationValidator:
    """Main class for validating MeatyMusic security documentation."""

    def __init__(self, project_root: Optional[str] = None):
        """Initialize the documentation validator."""
        self.project_root = Path(project_root) if project_root else Path(__file__).parent.parent
        self.docs_dir = self.project_root / "docs"
        self.services_dir = self.project_root / "services"

        # Validation results storage
        self.validation_results: List[ValidationResult] = []
        self.code_examples: List[CodeExample] = []
        self.links_to_check: List[Tuple[str, str, int]] = []

        # Configuration
        self.config = self._load_config()

        # Statistics
        self.stats = {
            'files_processed': 0,
            'code_examples_found': 0,
            'links_checked': 0,
            'errors_found': 0,
            'warnings_found': 0
        }

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration for documentation validation."""
        return {
            'code_validation': {
                'supported_languages': ['python', 'sql', 'json', 'yaml', 'bash', 'javascript'],
                'python_timeout': 30,
                'sql_validation': True,
                'json_validation': True
            },
            'link_validation': {
                'timeout': 10,
                'max_workers': 5,
                'allowed_status_codes': [200, 301, 302, 403],  # 403 for rate-limited sites
                'skip_patterns': [
                    r'localhost',
                    r'127\.0\.0\.1',
                    r'example\.com',
                    r'placeholder\.com'
                ],
                'internal_domains': ['meatymusic.com', 'docs.meatymusic.com']
            },
            'documentation_standards': {
                'required_sections': [
                    'Security Overview',
                    'Authentication',
                    'Row Level Security',
                    'Performance Monitoring',
                    'Troubleshooting'
                ],
                'max_line_length': 100,
                'required_files': [
                    'docs/security/overview.md',
                    'docs/security/authentication.md',
                    'docs/security/rls.md',
                    'docs/security/monitoring.md'
                ]
            }
        }

    def validate_all(self) -> bool:
        """Run all validation checks."""
        logger.info("Starting comprehensive documentation validation...")

        try:
            # Find all documentation files
            self._discover_documentation_files()

            # Run validation checks
            self._validate_code_examples()
            self._validate_links()
            self._validate_documentation_completeness()
            self._validate_formatting()
            self._validate_content_accuracy()

            # Generate validation report
            self._generate_validation_report()

            # Determine overall success
            error_count = sum(1 for r in self.validation_results if r.status == 'fail')
            warning_count = sum(1 for r in self.validation_results if r.status == 'warning')

            self.stats['errors_found'] = error_count
            self.stats['warnings_found'] = warning_count

            logger.info(f"Validation completed: {error_count} errors, {warning_count} warnings")

            return error_count == 0

        except Exception as e:
            logger.error(f"Validation failed with error: {e}")
            return False

    def _discover_documentation_files(self) -> List[Path]:
        """Discover all documentation files to validate."""
        doc_files = []

        # Find markdown files
        for pattern in ['**/*.md', '**/*.rst', '**/*.txt']:
            doc_files.extend(self.docs_dir.glob(pattern))

        # Also check for inline documentation in code
        for pattern in ['**/*.py', '**/*.sql']:
            doc_files.extend(self.services_dir.glob(pattern))

        self.stats['files_processed'] = len(doc_files)
        logger.info(f"Found {len(doc_files)} documentation files to validate")

        return doc_files

    def _validate_code_examples(self) -> bool:
        """Validate code examples found in documentation."""
        logger.info("Validating code examples in documentation...")

        self._extract_code_examples()

        validation_success = True

        for example in self.code_examples:
            try:
                if example.language == 'python':
                    result = self._validate_python_code(example)
                elif example.language == 'sql':
                    result = self._validate_sql_code(example)
                elif example.language == 'json':
                    result = self._validate_json_code(example)
                elif example.language == 'yaml':
                    result = self._validate_yaml_code(example)
                else:
                    result = ValidationResult(
                        check_type='code_example',
                        file_path=example.file_path,
                        status='warning',
                        message=f"Code validation not implemented for {example.language}"
                    )

                self.validation_results.append(result)

                if result.status == 'fail':
                    validation_success = False

            except Exception as e:
                logger.error(f"Error validating code example: {e}")
                validation_success = False

        logger.info(f"Code example validation completed: {len(self.code_examples)} examples checked")
        return validation_success

    def _extract_code_examples(self):
        """Extract code examples from documentation files."""
        doc_files = self._discover_documentation_files()

        for doc_file in doc_files:
            if doc_file.suffix not in ['.md', '.rst']:
                continue

            try:
                with open(doc_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract code blocks (markdown format)
                code_block_pattern = r'```(\w+)?\n(.*?)\n```'
                matches = re.finditer(code_block_pattern, content, re.DOTALL)

                for match in matches:
                    language = match.group(1) or 'text'
                    code = match.group(2)
                    line_number = content[:match.start()].count('\n') + 1

                    # Get context (surrounding text)
                    context_start = max(0, match.start() - 200)
                    context_end = min(len(content), match.end() + 200)
                    context = content[context_start:context_end].strip()

                    if language in self.config['code_validation']['supported_languages']:
                        self.code_examples.append(CodeExample(
                            file_path=str(doc_file),
                            language=language,
                            code=code,
                            line_number=line_number,
                            context=context
                        ))

            except Exception as e:
                logger.warning(f"Could not extract code examples from {doc_file}: {e}")

        self.stats['code_examples_found'] = len(self.code_examples)

    def _validate_python_code(self, example: CodeExample) -> ValidationResult:
        """Validate Python code example."""
        try:
            # Basic syntax check
            ast.parse(example.code)

            # Try to run the code in a restricted environment
            if self._is_safe_python_code(example.code):
                result = self._execute_python_code(example.code)
                if result['success']:
                    return ValidationResult(
                        check_type='python_code',
                        file_path=example.file_path,
                        status='pass',
                        message=f"Python code at line {example.line_number} is valid",
                        details={'execution_result': result}
                    )
                else:
                    return ValidationResult(
                        check_type='python_code',
                        file_path=example.file_path,
                        status='fail',
                        message=f"Python code at line {example.line_number} failed execution: {result['error']}",
                        details={'execution_result': result}
                    )
            else:
                return ValidationResult(
                    check_type='python_code',
                    file_path=example.file_path,
                    status='warning',
                    message=f"Python code at line {example.line_number} contains potentially unsafe operations"
                )

        except SyntaxError as e:
            return ValidationResult(
                check_type='python_code',
                file_path=example.file_path,
                status='fail',
                message=f"Python syntax error at line {example.line_number}: {e}"
            )

    def _is_safe_python_code(self, code: str) -> bool:
        """Check if Python code is safe to execute."""
        unsafe_patterns = [
            r'import\s+(os|sys|subprocess|shutil)',
            r'exec\s*\(',
            r'eval\s*\(',
            r'__import__',
            r'open\s*\(',
            r'file\s*\(',
            r'input\s*\(',
            r'raw_input\s*\('
        ]

        for pattern in unsafe_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return False

        return True

    def _execute_python_code(self, code: str) -> Dict[str, Any]:
        """Execute Python code in a restricted environment."""
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name

            # Execute the code
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=self.config['code_validation']['python_timeout']
            )

            # Clean up
            os.unlink(temp_file)

            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Code execution timed out'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _validate_sql_code(self, example: CodeExample) -> ValidationResult:
        """Validate SQL code example."""
        try:
            # Basic SQL syntax validation
            sql = example.code.strip()

            # Check for common SQL patterns
            sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP']
            has_sql_keyword = any(keyword in sql.upper() for keyword in sql_keywords)

            if not has_sql_keyword:
                return ValidationResult(
                    check_type='sql_code',
                    file_path=example.file_path,
                    status='warning',
                    message=f"SQL code at line {example.line_number} doesn't contain recognized SQL keywords"
                )

            # Check for dangerous operations in documentation examples
            dangerous_patterns = [r'DROP\s+TABLE', r'DELETE\s+FROM.*WHERE.*=.*']
            for pattern in dangerous_patterns:
                if re.search(pattern, sql, re.IGNORECASE):
                    return ValidationResult(
                        check_type='sql_code',
                        file_path=example.file_path,
                        status='warning',
                        message=f"SQL code at line {example.line_number} contains potentially dangerous operations"
                    )

            return ValidationResult(
                check_type='sql_code',
                file_path=example.file_path,
                status='pass',
                message=f"SQL code at line {example.line_number} appears valid"
            )

        except Exception as e:
            return ValidationResult(
                check_type='sql_code',
                file_path=example.file_path,
                status='fail',
                message=f"SQL validation error at line {example.line_number}: {e}"
            )

    def _validate_json_code(self, example: CodeExample) -> ValidationResult:
        """Validate JSON code example."""
        try:
            json.loads(example.code)
            return ValidationResult(
                check_type='json_code',
                file_path=example.file_path,
                status='pass',
                message=f"JSON code at line {example.line_number} is valid"
            )
        except json.JSONDecodeError as e:
            return ValidationResult(
                check_type='json_code',
                file_path=example.file_path,
                status='fail',
                message=f"JSON syntax error at line {example.line_number}: {e}"
            )

    def _validate_yaml_code(self, example: CodeExample) -> ValidationResult:
        """Validate YAML code example."""
        try:
            yaml.safe_load(example.code)
            return ValidationResult(
                check_type='yaml_code',
                file_path=example.file_path,
                status='pass',
                message=f"YAML code at line {example.line_number} is valid"
            )
        except yaml.YAMLError as e:
            return ValidationResult(
                check_type='yaml_code',
                file_path=example.file_path,
                status='fail',
                message=f"YAML syntax error at line {example.line_number}: {e}"
            )

    def _validate_links(self) -> bool:
        """Validate all links found in documentation."""
        logger.info("Validating links in documentation...")

        self._extract_links()

        if not self.links_to_check:
            logger.info("No links found to validate")
            return True

        # Validate links concurrently
        link_results = []
        with ThreadPoolExecutor(max_workers=self.config['link_validation']['max_workers']) as executor:
            future_to_link = {
                executor.submit(self._check_link, url, source_file, line_num): (url, source_file, line_num)
                for url, source_file, line_num in self.links_to_check
            }

            for future in as_completed(future_to_link):
                url, source_file, line_num = future_to_link[future]
                try:
                    result = future.result()
                    link_results.append(result)
                except Exception as e:
                    logger.error(f"Error checking link {url}: {e}")
                    link_results.append(LinkCheck(
                        url=url,
                        status_code=None,
                        is_valid=False,
                        error_message=str(e),
                        source_file=source_file,
                        line_number=line_num
                    ))

        # Process results
        validation_success = True
        for result in link_results:
            status = 'pass' if result.is_valid else 'fail'
            if not result.is_valid:
                validation_success = False

            self.validation_results.append(ValidationResult(
                check_type='link_validation',
                file_path=result.source_file,
                status=status,
                message=f"Link {result.url} - Status: {result.status_code or 'Error'}",
                details={'link_check': result.__dict__}
            ))

        self.stats['links_checked'] = len(link_results)
        logger.info(f"Link validation completed: {len(link_results)} links checked")

        return validation_success

    def _extract_links(self):
        """Extract all links from documentation files."""
        doc_files = self._discover_documentation_files()

        for doc_file in doc_files:
            if doc_file.suffix not in ['.md', '.rst']:
                continue

            try:
                with open(doc_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract markdown links [text](url)
                markdown_links = re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', content)
                for match in markdown_links:
                    url = match.group(2)
                    line_number = content[:match.start()].count('\n') + 1
                    self.links_to_check.append((url, str(doc_file), line_number))

                # Extract bare URLs
                url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]*'
                url_matches = re.finditer(url_pattern, content)
                for match in url_matches:
                    url = match.group(0)
                    line_number = content[:match.start()].count('\n') + 1
                    self.links_to_check.append((url, str(doc_file), line_number))

            except Exception as e:
                logger.warning(f"Could not extract links from {doc_file}: {e}")

    def _check_link(self, url: str, source_file: str, line_number: int) -> LinkCheck:
        """Check if a single link is valid."""
        # Skip certain patterns
        for pattern in self.config['link_validation']['skip_patterns']:
            if re.search(pattern, url):
                return LinkCheck(
                    url=url,
                    status_code=None,
                    is_valid=True,  # Skip validation
                    error_message="Skipped based on configuration",
                    source_file=source_file,
                    line_number=line_number
                )

        try:
            response = requests.head(
                url,
                timeout=self.config['link_validation']['timeout'],
                allow_redirects=True,
                headers={'User-Agent': 'MeatyMusic Documentation Validator'}
            )

            is_valid = response.status_code in self.config['link_validation']['allowed_status_codes']

            return LinkCheck(
                url=url,
                status_code=response.status_code,
                is_valid=is_valid,
                error_message=None if is_valid else f"HTTP {response.status_code}",
                source_file=source_file,
                line_number=line_number
            )

        except requests.exceptions.RequestException as e:
            return LinkCheck(
                url=url,
                status_code=None,
                is_valid=False,
                error_message=str(e),
                source_file=source_file,
                line_number=line_number
            )

    def _validate_documentation_completeness(self) -> bool:
        """Validate that required documentation sections exist."""
        logger.info("Validating documentation completeness...")

        validation_success = True

        # Check for required files
        for required_file in self.config['documentation_standards']['required_files']:
            file_path = self.project_root / required_file
            if not file_path.exists():
                self.validation_results.append(ValidationResult(
                    check_type='completeness',
                    file_path=required_file,
                    status='fail',
                    message=f"Required documentation file missing: {required_file}"
                ))
                validation_success = False
            else:
                self.validation_results.append(ValidationResult(
                    check_type='completeness',
                    file_path=required_file,
                    status='pass',
                    message=f"Required file exists: {required_file}"
                ))

        # Check for required sections in main documentation files
        security_docs = list((self.docs_dir / "security").glob("*.md")) if (self.docs_dir / "security").exists() else []

        for doc_file in security_docs:
            try:
                with open(doc_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for required sections
                missing_sections = []
                for section in self.config['documentation_standards']['required_sections']:
                    if section not in content:
                        missing_sections.append(section)

                if missing_sections:
                    self.validation_results.append(ValidationResult(
                        check_type='completeness',
                        file_path=str(doc_file),
                        status='warning',
                        message=f"Missing sections: {', '.join(missing_sections)}"
                    ))
                else:
                    self.validation_results.append(ValidationResult(
                        check_type='completeness',
                        file_path=str(doc_file),
                        status='pass',
                        message="All required sections present"
                    ))

            except Exception as e:
                logger.warning(f"Could not check completeness of {doc_file}: {e}")

        return validation_success

    def _validate_formatting(self) -> bool:
        """Validate documentation formatting and style."""
        logger.info("Validating documentation formatting...")

        doc_files = self._discover_documentation_files()
        validation_success = True

        for doc_file in doc_files:
            if doc_file.suffix != '.md':
                continue

            try:
                with open(doc_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()

                formatting_issues = []

                for i, line in enumerate(lines, 1):
                    # Check line length
                    if len(line.rstrip()) > self.config['documentation_standards']['max_line_length']:
                        formatting_issues.append(f"Line {i}: Line too long ({len(line.rstrip())} chars)")

                    # Check for trailing whitespace
                    if line.rstrip() != line.rstrip('\n'):
                        formatting_issues.append(f"Line {i}: Trailing whitespace")

                if formatting_issues:
                    self.validation_results.append(ValidationResult(
                        check_type='formatting',
                        file_path=str(doc_file),
                        status='warning',
                        message=f"Formatting issues found: {len(formatting_issues)}",
                        details={'issues': formatting_issues}
                    ))
                else:
                    self.validation_results.append(ValidationResult(
                        check_type='formatting',
                        file_path=str(doc_file),
                        status='pass',
                        message="Formatting is correct"
                    ))

            except Exception as e:
                logger.warning(f"Could not check formatting of {doc_file}: {e}")

        return validation_success

    def _validate_content_accuracy(self) -> bool:
        """Validate content accuracy against actual implementation."""
        logger.info("Validating content accuracy...")

        # This is a placeholder for more sophisticated content validation
        # In a full implementation, this would:
        # - Check API documentation against actual API endpoints
        # - Validate configuration examples against schema
        # - Check that code examples match current implementation patterns

        validation_success = True

        # Example: Check that metric names in documentation match actual metric names
        metrics_mentioned = self._extract_metric_names_from_docs()
        actual_metrics = self._get_actual_metric_names()

        for metric in metrics_mentioned:
            if metric not in actual_metrics:
                self.validation_results.append(ValidationResult(
                    check_type='accuracy',
                    file_path='docs/security/',
                    status='warning',
                    message=f"Metric '{metric}' mentioned in docs but not found in implementation"
                ))

        return validation_success

    def _extract_metric_names_from_docs(self) -> Set[str]:
        """Extract metric names mentioned in documentation."""
        metric_names = set()
        metric_pattern = r'meatymusic_[a-zA-Z_][a-zA-Z0-9_]*'

        doc_files = self._discover_documentation_files()
        for doc_file in doc_files:
            if doc_file.suffix != '.md':
                continue

            try:
                with open(doc_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                matches = re.finditer(metric_pattern, content)
                for match in matches:
                    metric_names.add(match.group(0))

            except Exception as e:
                logger.debug(f"Could not extract metrics from {doc_file}: {e}")

        return metric_names

    def _get_actual_metric_names(self) -> Set[str]:
        """Get actual metric names from the implementation."""
        # This would typically query the actual metrics endpoint or parse code
        # For now, return the expected metrics from our monitoring setup
        return {
            'meatymusic_security_boundary_violations_total',
            'meatymusic_auth_failures_total',
            'meatymusic_security_query_duration_seconds',
            'meatymusic_rls_policy_applied_total',
            'meatymusic_db_queries_total',
            'meatymusic_security_contexts_active',
            'meatymusic_security_context_created_total',
            'meatymusic_security_context_validation_errors_total',
            'meatymusic_rls_overhead_seconds',
            'meatymusic_security_memory_usage_bytes',
            'meatymusic_security_cache_hits_total',
            'meatymusic_security_cache_requests_total'
        }

    def _generate_validation_report(self):
        """Generate a comprehensive validation report."""
        logger.info("Generating validation report...")

        report = {
            'summary': {
                'total_checks': len(self.validation_results),
                'passed': len([r for r in self.validation_results if r.status == 'pass']),
                'failed': len([r for r in self.validation_results if r.status == 'fail']),
                'warnings': len([r for r in self.validation_results if r.status == 'warning']),
                'statistics': self.stats
            },
            'checks_by_type': {},
            'failed_checks': [],
            'warnings': []
        }

        # Group results by check type
        for result in self.validation_results:
            if result.check_type not in report['checks_by_type']:
                report['checks_by_type'][result.check_type] = {
                    'passed': 0,
                    'failed': 0,
                    'warnings': 0
                }

            if result.status == 'pass':
                report['checks_by_type'][result.check_type]['passed'] += 1
            elif result.status == 'fail':
                report['checks_by_type'][result.check_type]['failed'] += 1
                report['failed_checks'].append(result.__dict__)
            else:  # warning
                report['checks_by_type'][result.check_type]['warnings'] += 1
                report['warnings'].append(result.__dict__)

        # Save report to file
        report_file = self.project_root / 'documentation-validation-report.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"Validation report saved to {report_file}")

        # Print summary
        print("\n" + "="*60)
        print("DOCUMENTATION VALIDATION SUMMARY")
        print("="*60)
        print(f"Total checks: {report['summary']['total_checks']}")
        print(f"Passed: {report['summary']['passed']}")
        print(f"Failed: {report['summary']['failed']}")
        print(f"Warnings: {report['summary']['warnings']}")
        print(f"Files processed: {report['summary']['statistics']['files_processed']}")
        print(f"Code examples: {report['summary']['statistics']['code_examples_found']}")
        print(f"Links checked: {report['summary']['statistics']['links_checked']}")
        print("="*60)

    def update_metrics_documentation(self) -> bool:
        """Update metrics documentation with current metric definitions."""
        logger.info("Updating metrics documentation...")

        try:
            # Get current metrics from Prometheus if available
            current_metrics = self._fetch_current_metrics()

            if current_metrics:
                # Update metrics documentation file
                metrics_doc_file = self.docs_dir / "analytics" / "metrics-definitions.md"

                if metrics_doc_file.exists():
                    updated_content = self._generate_metrics_documentation(current_metrics)

                    with open(metrics_doc_file, 'w') as f:
                        f.write(updated_content)

                    logger.info(f"Updated metrics documentation: {metrics_doc_file}")
                    return True
                else:
                    logger.warning(f"Metrics documentation file not found: {metrics_doc_file}")
                    return False
            else:
                logger.warning("Could not fetch current metrics for documentation update")
                return False

        except Exception as e:
            logger.error(f"Failed to update metrics documentation: {e}")
            return False

    def _fetch_current_metrics(self) -> Optional[Dict[str, Any]]:
        """Fetch current metrics from Prometheus."""
        try:
            prometheus_url = os.getenv('PROMETHEUS_URL', 'http://localhost:9090')
            response = requests.get(
                f"{prometheus_url}/api/v1/label/__name__/values",
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    metrics = data.get('data', [])
                    # Filter for meatymusic metrics
                    return [m for m in metrics if m.startswith('meatymusic_')]

            return None

        except Exception as e:
            logger.debug(f"Could not fetch metrics from Prometheus: {e}")
            return None

    def _generate_metrics_documentation(self, metrics: List[str]) -> str:
        """Generate updated metrics documentation."""
        content = f"""# MeatyMusic Metrics Definitions

This document is automatically generated and contains definitions for all
MeatyMusic metrics exposed to monitoring systems.

Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Security Metrics

"""

        security_metrics = [m for m in metrics if 'security' in m]
        for metric in sorted(security_metrics):
            content += f"### {metric}\n\n"
            content += f"**Type:** Counter/Histogram/Gauge\n"
            content += f"**Description:** [Auto-generated - add description]\n"
            content += f"**Labels:** [Add label descriptions]\n\n"

        content += "## Authentication Metrics\n\n"
        auth_metrics = [m for m in metrics if 'auth' in m]
        for metric in sorted(auth_metrics):
            content += f"### {metric}\n\n"
            content += f"**Type:** Counter/Histogram/Gauge\n"
            content += f"**Description:** [Auto-generated - add description]\n"
            content += f"**Labels:** [Add label descriptions]\n\n"

        content += "## Database Metrics\n\n"
        db_metrics = [m for m in metrics if 'db' in m or 'rls' in m]
        for metric in sorted(db_metrics):
            content += f"### {metric}\n\n"
            content += f"**Type:** Counter/Histogram/Gauge\n"
            content += f"**Description:** [Auto-generated - add description]\n"
            content += f"**Labels:** [Add label descriptions]\n\n"

        return content

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Validate MeatyMusic security documentation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/documentation-validator.py --validate-all
  python scripts/documentation-validator.py --check-code-examples
  python scripts/documentation-validator.py --check-links
  python scripts/documentation-validator.py --update-metrics
        """
    )

    parser.add_argument('--project-root', help='Project root directory path')

    # Validation options
    parser.add_argument('--validate-all', action='store_true',
                       help='Run all validation checks')
    parser.add_argument('--check-code-examples', action='store_true',
                       help='Validate code examples in documentation')
    parser.add_argument('--check-links', action='store_true',
                       help='Check all links in documentation')
    parser.add_argument('--check-completeness', action='store_true',
                       help='Check documentation completeness')
    parser.add_argument('--check-formatting', action='store_true',
                       help='Check documentation formatting')
    parser.add_argument('--check-accuracy', action='store_true',
                       help='Check content accuracy against implementation')

    # Update options
    parser.add_argument('--update-metrics', action='store_true',
                       help='Update metrics documentation')

    # Output options
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--quiet', '-q', action='store_true',
                       help='Suppress non-error output')
    parser.add_argument('--output-format', choices=['text', 'json'],
                       default='text', help='Output format')

    args = parser.parse_args()

    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger().setLevel(logging.ERROR)

    try:
        # Initialize validator
        validator = DocumentationValidator(args.project_root)

        # Determine what to run
        if args.validate_all:
            success = validator.validate_all()
        elif args.update_metrics:
            success = validator.update_metrics_documentation()
        else:
            success = True

            if args.check_code_examples:
                success = validator._validate_code_examples() and success

            if args.check_links:
                success = validator._validate_links() and success

            if args.check_completeness:
                success = validator._validate_documentation_completeness() and success

            if args.check_formatting:
                success = validator._validate_formatting() and success

            if args.check_accuracy:
                success = validator._validate_content_accuracy() and success

            # Generate report if any checks were run
            if any([args.check_code_examples, args.check_links, args.check_completeness,
                   args.check_formatting, args.check_accuracy]):
                validator._generate_validation_report()

        if success:
            logger.info("Documentation validation completed successfully!")
            sys.exit(0)
        else:
            logger.error("Documentation validation failed!")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("Validation cancelled by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        if args.verbose:
            logger.exception("Full traceback:")
        sys.exit(1)

if __name__ == '__main__':
    main()
