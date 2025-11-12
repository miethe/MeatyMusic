/**
 * Circuit Breaker Pattern Implementation for API package
 *
 * Prevents cascade failures by tracking error rates and temporarily
 * stopping requests when failure threshold is exceeded.
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  successThreshold?: number;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  nextAttempt: number;
}

export class CircuitBreakerError extends Error {
  constructor(public readonly circuitState: CircuitState) {
    super(`Circuit breaker is ${circuitState}`);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Simple circuit breaker for API errors
 */
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(
    private readonly name: string,
    config: CircuitBreakerConfig
  ) {
    this.config = {
      successThreshold: 1,
      ...config,
    };

    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttempt: 0,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.shouldRejectRequest()) {
      throw new CircuitBreakerError(this.state.state);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldRejectRequest(): boolean {
    const now = Date.now();

    switch (this.state.state) {
      case CircuitState.CLOSED:
        return false;

      case CircuitState.OPEN:
        if (now >= this.state.nextAttempt) {
          this.state.state = CircuitState.HALF_OPEN;
          this.state.successCount = 0;
          return false;
        }
        return true;

      case CircuitState.HALF_OPEN:
        return false;

      default:
        return false;
    }
  }

  private onSuccess(): void {
    this.state.successCount++;

    if (this.state.state === CircuitState.HALF_OPEN) {
      if (this.state.successCount >= this.config.successThreshold) {
        this.reset();
      }
    } else if (this.state.state === CircuitState.CLOSED) {
      this.reset();
    }
  }

  private onFailure(): void {
    const now = Date.now();
    this.state.failureCount++;
    this.state.lastFailureTime = now;
    this.state.successCount = 0;

    if (this.state.failureCount >= this.config.failureThreshold) {
      this.state.state = CircuitState.OPEN;
      this.state.nextAttempt = now + this.config.recoveryTimeout;
    }

    this.cleanupOldFailures(now);
  }

  private reset(): void {
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttempt: 0,
    };
  }

  private cleanupOldFailures(now: number): void {
    const cutoff = now - this.config.monitoringPeriod;
    if (this.state.lastFailureTime < cutoff) {
      this.state.failureCount = Math.max(0, this.state.failureCount - 1);
    }
  }

  forceOpen(recoveryTimeMs?: number): void {
    const now = Date.now();
    this.state.state = CircuitState.OPEN;
    this.state.nextAttempt = now + (recoveryTimeMs ?? this.config.recoveryTimeout);
  }

  /**
   * Manually reset the circuit (for testing or recovery scenarios)
   */
  forceReset(): void {
    this.reset();
  }

  /**
   * Conditional reset for method binding recovery
   * Only resets if we're dealing with method binding issues and cache has been cleared
   */
  resetIfMethodBinding(wasServiceRecreated: boolean = false): void {
    if (this.name === 'method-binding' && wasServiceRecreated) {
      console.log('Method binding circuit breaker: resetting due to service recreation');
      this.reset();
    } else if (this.name === 'method-binding' && this.state.state === CircuitState.OPEN) {
      // For method binding, allow faster recovery by shortening timeout
      const now = Date.now();
      this.state.nextAttempt = Math.min(this.state.nextAttempt, now + 1000); // Allow retry in 1 second
      console.log('Method binding circuit breaker: accelerated recovery timeout');
    }
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.state.state,
      failureCount: this.state.failureCount,
      successCount: this.state.successCount,
      config: this.config,
    };
  }
}

// Global circuit breaker registry outside of class to ensure singleton behavior across modules
const globalCircuitBreakerRegistry = new Map<string, CircuitBreaker>();

/**
 * Circuit breaker factory with global singleton management
 * Ensures same circuit breaker instances are shared across all packages
 */
export class CircuitBreakerFactory {
  private static breakers = globalCircuitBreakerRegistry;

  static getCircuitBreaker(
    name: string,
    config: CircuitBreakerConfig
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(name, config);
      this.breakers.set(name, breaker);
    }
    return this.breakers.get(name)!;
  }

  static createMethodBindingBreaker(): CircuitBreaker {
    return this.getCircuitBreaker('method-binding', {
      failureThreshold: 1, // Fail immediately
      recoveryTimeout: 5_000, // Try again after 5 seconds (shorter for faster recovery)
      monitoringPeriod: 60_000, // Monitor for 1 minute
      successThreshold: 1,
    });
  }

  static createThemeSyncBreaker(): CircuitBreaker {
    return this.getCircuitBreaker('theme-sync', {
      failureThreshold: 3, // Allow up to 3 failures before opening
      recoveryTimeout: 60_000, // Try again after 1 minute
      monitoringPeriod: 300_000, // Monitor for 5 minutes
      successThreshold: 1,
    });
  }

  /**
   * Create circuit breaker for user preferences API
   */
  static createUserPreferencesBreaker(): CircuitBreaker {
    return this.getCircuitBreaker('user-preferences', {
      failureThreshold: 3, // Allow 3 failures
      recoveryTimeout: 10_000, // Try again after 10 seconds
      monitoringPeriod: 60_000, // Monitor for 1 minute
      successThreshold: 2, // Need 2 successes to close
    });
  }

  static clearAll(): void {
    this.breakers.clear();
  }

  /**
   * Get metrics for all circuit breakers
   */
  static getAllMetrics() {
    return Array.from(this.breakers.values()).map(breaker => breaker.getMetrics());
  }

  /**
   * Get circuit breaker by name (for debugging)
   */
  static getBreakerByName(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Check if a circuit breaker exists
   */
  static hasBreakerNamed(name: string): boolean {
    return this.breakers.has(name);
  }

  /**
   * Get registry size (for debugging)
   */
  static getRegistrySize(): number {
    return this.breakers.size;
  }

  /**
   * Force open all circuit breakers (emergency use)
   */
  static forceOpenAll(recoveryTimeMs?: number): void {
    this.breakers.forEach(breaker => {
      breaker.forceOpen(recoveryTimeMs);
    });
  }

  /**
   * Force reset all circuit breakers
   */
  static forceResetAll(): void {
    this.breakers.forEach(breaker => {
      breaker.forceReset();
    });
  }
}
