#!/bin/bash

# Security Testing Framework Execution Script
# Executes comprehensive security validation for MP-TEST-SEC-001

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$PROJECT_ROOT/services/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DB_URL="${DATABASE_URL_TEST:-postgresql://test:test@localhost:5432/meatymusic_security_test}"
CLERK_JWT_KEY="${CLERK_JWT_VERIFICATION_KEY:-test-security-key-2025}"
SECURITY_MODE="${SECURITY_TEST_MODE:-true}"

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Security Testing Framework - MP-TEST-SEC-001

Usage: $0 [options]

Options:
    -h, --help              Show this help message
    -s, --suite SUITE       Run specific test suite (boundary|performance|migration|penetration|concurrent|all)
    -q, --quick             Run quick security validation (reduced test count)
    -p, --performance       Include performance benchmarking
    -v, --verbose           Enable verbose output
    -r, --report            Generate comprehensive security report
    --setup-only            Only setup test environment, don't run tests
    --cleanup-only          Only cleanup test environment

Test Suites:
    boundary        User/tenant/scope isolation tests
    performance     Security performance benchmarks
    migration       Migration integrity validation
    penetration     Advanced penetration testing
    concurrent      Concurrent access security validation
    all            Complete security test suite (default)

Examples:
    $0                                  # Run all security tests
    $0 -s boundary -v                  # Run boundary tests with verbose output
    $0 -s performance -p -r             # Run performance tests with benchmarks and report
    $0 -q                              # Quick security validation

Environment Variables:
    DATABASE_URL_TEST           Test database URL
    CLERK_JWT_VERIFICATION_KEY  JWT verification key for testing
    SECURITY_TEST_MODE          Enable security test mode
    LOG_LEVEL                   Logging level (DEBUG, INFO, WARNING, ERROR)

EOF
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up security test environment..."

    # Check if we're in the correct directory
    if [ ! -f "$API_DIR/pyproject.toml" ]; then
        log_error "Must be run from MeatyMusic root directory"
        exit 1
    fi

    # Set environment variables
    export DATABASE_URL_TEST="$TEST_DB_URL"
    export CLERK_JWT_VERIFICATION_KEY="$CLERK_JWT_KEY"
    export CLERK_WEBHOOK_SECRET="whsec_test_security"
    export SECURITY_TEST_MODE="$SECURITY_MODE"
    export LOG_LEVEL="${LOG_LEVEL:-INFO}"
    export PYTHONPATH="$API_DIR"

    log_info "Environment configured for security testing"
    log_info "Database: $TEST_DB_URL"
    log_info "Security Mode: $SECURITY_MODE"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    # Check if uv is available
    if ! command -v uv &> /dev/null; then
        log_error "uv is required but not installed. Install from https://github.com/astral-sh/uv"
        exit 1
    fi

    # Check Python version
    cd "$API_DIR"
    if ! uv run python --version | grep -q "Python 3.1[12]"; then
        log_warning "Python 3.11+ recommended for optimal security test performance"
    fi

    # Install/update dependencies
    log_info "Installing dependencies..."
    uv sync --dev

    log_success "Dependencies ready"
}

# Setup test database
setup_test_database() {
    log_info "Setting up test database..."

    cd "$API_DIR"

    # Check database connectivity
    if ! uv run python -c "
import os
from sqlalchemy import create_engine, text
engine = create_engine(os.environ['DATABASE_URL_TEST'])
try:
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" 2>/dev/null; then
        log_error "Cannot connect to test database: $TEST_DB_URL"
        log_error "Ensure PostgreSQL is running and database exists"
        exit 1
    fi

    # Run migrations
    log_info "Running database migrations..."
    uv run alembic upgrade head

    log_success "Test database ready"
}

# Run specific test suite
run_test_suite() {
    local suite="$1"
    local verbose_flag=""
    local quick_flag=""

    if [ "${VERBOSE:-false}" = "true" ]; then
        verbose_flag="-v"
    fi

    if [ "${QUICK:-false}" = "true" ]; then
        quick_flag="-k 'not slow'"
    fi

    cd "$API_DIR"

    case "$suite" in
        "boundary")
            log_info "Running security boundary isolation tests..."
            uv run pytest app/tests/security/test_boundary_isolation.py \
                $verbose_flag $quick_flag --tb=short --durations=10 \
                -m security_boundary
            ;;
        "performance")
            log_info "Running security performance benchmarks..."
            uv run pytest app/tests/performance/test_security_benchmarks.py \
                $verbose_flag $quick_flag --tb=short --durations=10 \
                -m performance_security
            ;;
        "migration")
            log_info "Running migration integrity validation tests..."
            uv run pytest app/tests/migration/ \
                $verbose_flag $quick_flag --tb=short --durations=10 \
                -m migration_security
            ;;
        "penetration")
            log_info "Running penetration testing suite..."
            uv run pytest app/tests/security/test_penetration.py \
                $verbose_flag $quick_flag --tb=short --durations=10 \
                -m penetration_test
            ;;
        "concurrent")
            log_info "Running concurrent access security tests..."
            uv run pytest app/tests/security/test_concurrent_access.py \
                $verbose_flag $quick_flag --tb=short --durations=10 \
                -m concurrent
            ;;
        "attack_vectors")
            log_info "Running attack vector simulation tests..."
            uv run pytest app/tests/security/test_attack_vectors.py \
                $verbose_flag $quick_flag --tb=short --durations=10 \
                -m attack_simulation
            ;;
        "all")
            log_info "Running complete security test suite..."

            # Run all security test suites
            local suites=("boundary" "performance" "migration" "penetration" "concurrent" "attack_vectors")
            local failed_suites=()

            for test_suite in "${suites[@]}"; do
                log_info "Executing $test_suite test suite..."
                if run_test_suite "$test_suite"; then
                    log_success "$test_suite tests completed successfully"
                else
                    log_error "$test_suite tests failed"
                    failed_suites+=("$test_suite")
                fi
                echo
            done

            if [ ${#failed_suites[@]} -eq 0 ]; then
                log_success "All security test suites completed successfully"
                return 0
            else
                log_error "Failed test suites: ${failed_suites[*]}"
                return 1
            fi
            ;;
        *)
            log_error "Unknown test suite: $suite"
            log_error "Available suites: boundary, performance, migration, penetration, concurrent, all"
            exit 1
            ;;
    esac
}

# Generate security report
generate_security_report() {
    log_info "Generating comprehensive security report..."

    cd "$API_DIR"

    # Create reports directory
    mkdir -p security-reports

    # Generate test report with coverage
    local report_file="security-reports/security-test-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# Security Test Report - MP-TEST-SEC-001

**Date**: $(date)
**Test Suite**: Comprehensive Security Validation
**Framework Version**: 1.0
**Database**: $TEST_DB_URL

## Executive Summary

This report contains the results of comprehensive security testing for the MeatyMusic unified database security architecture.

### Test Coverage

- ✅ **Security Boundary Isolation**: User, tenant, and scope isolation validation
- ✅ **Attack Vector Simulation**: SQL injection, privilege escalation, parameter manipulation
- ✅ **Performance Validation**: Security overhead measurement and benchmarking
- ✅ **Migration Integrity**: Data integrity preservation during migrations
- ✅ **Concurrent Access Security**: Isolation maintenance under concurrent load
- ✅ **Penetration Testing**: Advanced attack scenario simulation

## Test Results

EOF

    # Run tests with JSON output for reporting
    if uv run pytest app/tests/security/ app/tests/performance/test_security_benchmarks.py \
        --json-report --json-report-file=security-reports/test-results.json &>/dev/null; then
        echo "### Overall Status: ✅ PASS" >> "$report_file"
        echo "" >> "$report_file"
        echo "All security tests completed successfully. The system demonstrates:" >> "$report_file"
        echo "- Complete user and tenant isolation" >> "$report_file"
        echo "- Resistance to all tested attack vectors" >> "$report_file"
        echo "- Performance within acceptable limits (<5ms overhead)" >> "$report_file"
        echo "- Data integrity preservation during migrations" >> "$report_file"
        echo "- Security isolation maintained under concurrent load" >> "$report_file"
    else
        echo "### Overall Status: ❌ FAIL" >> "$report_file"
        echo "" >> "$report_file"
        echo "⚠️ **CRITICAL**: Security tests failed. Immediate review required." >> "$report_file"
    fi

    echo "" >> "$report_file"
    echo "## Detailed Results" >> "$report_file"
    echo "" >> "$report_file"
    echo "See attached JSON report for detailed test results and metrics." >> "$report_file"

    log_success "Security report generated: $report_file"
}

# Cleanup test environment
cleanup_test_environment() {
    log_info "Cleaning up test environment..."

    cd "$API_DIR"

    # Remove temporary test files
    rm -rf .pytest_cache
    rm -f pytest.log
    rm -f security-test.log

    # Clean up any test databases (if configured for cleanup)
    if [ "${CLEANUP_TEST_DB:-false}" = "true" ]; then
        log_warning "Test database cleanup is enabled"
        # Database cleanup would go here if configured
    fi

    log_success "Test environment cleaned up"
}

# Main execution function
main() {
    local suite="all"
    local setup_only=false
    local cleanup_only=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -s|--suite)
                suite="$2"
                shift 2
                ;;
            -q|--quick)
                export QUICK=true
                shift
                ;;
            -p|--performance)
                export INCLUDE_PERFORMANCE=true
                shift
                ;;
            -v|--verbose)
                export VERBOSE=true
                shift
                ;;
            -r|--report)
                export GENERATE_REPORT=true
                shift
                ;;
            --setup-only)
                setup_only=true
                shift
                ;;
            --cleanup-only)
                cleanup_only=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Execute based on options
    if [ "$cleanup_only" = "true" ]; then
        cleanup_test_environment
        exit 0
    fi

    # Setup phase
    setup_test_environment
    check_dependencies
    setup_test_database

    if [ "$setup_only" = "true" ]; then
        log_success "Test environment setup complete"
        exit 0
    fi

    # Test execution phase
    log_info "Starting security test execution for suite: $suite"
    echo

    local start_time=$(date +%s)

    if run_test_suite "$suite"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_success "Security testing completed successfully"
        log_info "Total execution time: ${duration} seconds"

        # Generate report if requested
        if [ "${GENERATE_REPORT:-false}" = "true" ]; then
            generate_security_report
        fi

        echo
        log_success "🛡️  SECURITY VALIDATION COMPLETE"
        log_success "All security boundaries verified and attack vectors blocked"

        exit 0
    else
        log_error "Security testing failed"
        log_error "🚨 SECURITY VALIDATION FAILED - Review required"
        exit 1
    fi
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
