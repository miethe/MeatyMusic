/**
 * @fileoverview Tests for circuit breaker singleton behavior
 *
 * These tests verify that circuit breakers maintain state across instantiation
 * and module boundaries, preventing the METHOD_BINDING_ERROR cascade.
 */

import { CircuitBreakerFactory, CircuitBreaker, CircuitState } from '../circuitBreaker';

describe('CircuitBreaker Singleton Management', () => {
  beforeEach(() => {
    // Clear all circuit breakers before each test
    CircuitBreakerFactory.clearAll();
  });

  afterEach(() => {
    // Reset all circuit breakers after each test
    CircuitBreakerFactory.forceResetAll();
    CircuitBreakerFactory.clearAll();
  });

  describe('Circuit Breaker Factory Singleton', () => {
    it('should return the same circuit breaker instance for identical names', () => {
      const config = {
        failureThreshold: 3,
        recoveryTimeout: 5000,
        monitoringPeriod: 10000
      };

      const breaker1 = CircuitBreakerFactory.getCircuitBreaker('test', config);
      const breaker2 = CircuitBreakerFactory.getCircuitBreaker('test', config);

      expect(breaker1).toBe(breaker2);
    });

    it('should maintain circuit breaker state across factory calls', async () => {
      const config = {
        failureThreshold: 1,
        recoveryTimeout: 5000,
        monitoringPeriod: 10000
      };

      // Get first instance and trigger failure
      const breaker1 = CircuitBreakerFactory.getCircuitBreaker('test-state', config);

      try {
        await breaker1.execute(async () => {
          throw new Error('Test failure');
        });
      } catch {
        // Expected to fail
      }

      // Circuit should now be open
      expect(breaker1.getMetrics().state).toBe(CircuitState.OPEN);

      // Get second instance - should be the same and still open
      const breaker2 = CircuitBreakerFactory.getCircuitBreaker('test-state', config);

      expect(breaker2).toBe(breaker1);
      expect(breaker2.getMetrics().state).toBe(CircuitState.OPEN);
    });

    it('should create different instances for different names', () => {
      const config = {
        failureThreshold: 3,
        recoveryTimeout: 5000,
        monitoringPeriod: 10000
      };

      const breaker1 = CircuitBreakerFactory.getCircuitBreaker('test1', config);
      const breaker2 = CircuitBreakerFactory.getCircuitBreaker('test2', config);

      expect(breaker1).not.toBe(breaker2);
    });
  });

  describe('Predefined Circuit Breakers', () => {
    it('should return singleton method binding breakers', () => {
      const breaker1 = CircuitBreakerFactory.createMethodBindingBreaker();
      const breaker2 = CircuitBreakerFactory.createMethodBindingBreaker();

      expect(breaker1).toBe(breaker2);
      expect(breaker1.getMetrics().name).toBe('method-binding');
    });

    it('should return singleton user preferences breakers', () => {
      const breaker1 = CircuitBreakerFactory.createUserPreferencesBreaker();
      const breaker2 = CircuitBreakerFactory.createUserPreferencesBreaker();

      expect(breaker1).toBe(breaker2);
      expect(breaker1.getMetrics().name).toBe('user-preferences');
    });

    it('should return singleton theme sync breakers', () => {
      const breaker1 = CircuitBreakerFactory.createThemeSyncBreaker();
      const breaker2 = CircuitBreakerFactory.createThemeSyncBreaker();

      expect(breaker1).toBe(breaker2);
      expect(breaker1.getMetrics().name).toBe('theme-sync');
    });
  });

  describe('Cross-Module State Persistence', () => {
    it('should maintain state when accessed from different contexts', async () => {
      // Simulate accessing from different modules/hooks
      const getUserPrefsBreaker = () => CircuitBreakerFactory.createUserPreferencesBreaker();
      const getThemeSyncBreaker = () => CircuitBreakerFactory.createThemeSyncBreaker();

      const userPrefsBreaker1 = getUserPrefsBreaker();
      const userPrefsBreaker2 = getUserPrefsBreaker();

      // Should be the same instance
      expect(userPrefsBreaker1).toBe(userPrefsBreaker2);

      // Different types should be different instances
      const themeSyncBreaker = getThemeSyncBreaker();
      expect(userPrefsBreaker1).not.toBe(themeSyncBreaker);
    });

    it('should persist open state across module boundaries', async () => {
      const config = {
        failureThreshold: 1,
        recoveryTimeout: 10000, // Long timeout for testing
        monitoringPeriod: 20000
      };

      // First module access - trigger failure
      const moduleA_breaker = CircuitBreakerFactory.getCircuitBreaker('cross-module', config);

      try {
        await moduleA_breaker.execute(async () => {
          throw new Error('Cross-module test failure');
        });
      } catch {
        // Expected to fail
      }

      expect(moduleA_breaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Second module access - should see the same open state
      const moduleB_breaker = CircuitBreakerFactory.getCircuitBreaker('cross-module', config);

      expect(moduleB_breaker).toBe(moduleA_breaker);
      expect(moduleB_breaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Third module tries to use the circuit breaker - should be rejected
      const moduleC_breaker = CircuitBreakerFactory.getCircuitBreaker('cross-module', config);

      await expect(
        moduleC_breaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('Factory Management', () => {
    it('should return correct registry size', () => {
      expect(CircuitBreakerFactory.getRegistrySize()).toBe(0);

      CircuitBreakerFactory.createMethodBindingBreaker();
      expect(CircuitBreakerFactory.getRegistrySize()).toBe(1);

      CircuitBreakerFactory.createUserPreferencesBreaker();
      expect(CircuitBreakerFactory.getRegistrySize()).toBe(2);

      CircuitBreakerFactory.createThemeSyncBreaker();
      expect(CircuitBreakerFactory.getRegistrySize()).toBe(3);
    });

    it('should provide access to breakers by name', () => {
      const methodBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
      const retrievedBreaker = CircuitBreakerFactory.getBreakerByName('method-binding');

      expect(retrievedBreaker).toBe(methodBreaker);
    });

    it('should indicate breaker existence', () => {
      expect(CircuitBreakerFactory.hasBreakerNamed('method-binding')).toBe(false);

      CircuitBreakerFactory.createMethodBindingBreaker();

      expect(CircuitBreakerFactory.hasBreakerNamed('method-binding')).toBe(true);
    });

    it('should get all metrics', () => {
      CircuitBreakerFactory.createMethodBindingBreaker();
      CircuitBreakerFactory.createUserPreferencesBreaker();

      const metrics = CircuitBreakerFactory.getAllMetrics();

      expect(metrics).toHaveLength(2);
      expect(metrics.some(m => m.name === 'method-binding')).toBe(true);
      expect(metrics.some(m => m.name === 'user-preferences')).toBe(true);
    });

    it('should force open all breakers', () => {
      const methodBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
      const userPrefsBreaker = CircuitBreakerFactory.createUserPreferencesBreaker();

      // Initially closed
      expect(methodBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(userPrefsBreaker.getMetrics().state).toBe(CircuitState.CLOSED);

      // Force open all
      CircuitBreakerFactory.forceOpenAll(1000);

      expect(methodBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(userPrefsBreaker.getMetrics().state).toBe(CircuitState.OPEN);
    });

    it('should force reset all breakers', () => {
      const methodBreaker = CircuitBreakerFactory.createMethodBindingBreaker();

      // Force open first
      methodBreaker.forceOpen();
      expect(methodBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Reset all
      CircuitBreakerFactory.forceResetAll();
      expect(methodBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Preventing METHOD_BINDING_ERROR Cascade', () => {
    it('should prevent cascade by sharing circuit breaker state', async () => {
      // Simulate multiple hook instances trying to access the same API
      const getMethodBindingBreaker = () => CircuitBreakerFactory.createMethodBindingBreaker();

      const hookInstance1_breaker = getMethodBindingBreaker();
      const hookInstance2_breaker = getMethodBindingBreaker();
      const hookInstance3_breaker = getMethodBindingBreaker();

      // All should be the same instance
      expect(hookInstance1_breaker).toBe(hookInstance2_breaker);
      expect(hookInstance2_breaker).toBe(hookInstance3_breaker);

      // First hook triggers method binding error
      try {
        await hookInstance1_breaker.execute(async () => {
          throw new Error('METHOD_BINDING_ERROR: get method is not available');
        });
      } catch {
        // Expected to fail and open the circuit
      }

      expect(hookInstance1_breaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Second hook should see the open circuit and not attempt the call
      await expect(
        hookInstance2_breaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker is OPEN');

      // Third hook should also see the open circuit
      await expect(
        hookInstance3_breaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker is OPEN');

      // Verify all instances show the same open state
      expect(hookInstance1_breaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(hookInstance2_breaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(hookInstance3_breaker.getMetrics().state).toBe(CircuitState.OPEN);
    });
  });
});
