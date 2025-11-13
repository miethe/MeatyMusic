/**
 * Performance monitoring utilities for tab switching and component rendering
 */

import { trackEvent } from './tracking';

/**
 * Performance budget thresholds (in milliseconds)
 */
export const PERFORMANCE_BUDGETS = {
  TAB_SWITCH: 100, // P95 target
  INITIAL_RENDER: 200, // P95 target
  DATA_FETCH: 500, // P95 target
} as const;

/**
 * Measure and track tab switch performance
 * Warns if budget is exceeded
 *
 * @param tabName - Name of the tab being switched to
 * @param startTime - Performance.now() timestamp when switch started
 * @param metadata - Additional context about the switch
 *
 * @example
 * ```tsx
 * const startTime = performance.now();
 * // ... tab switch logic ...
 * measureTabSwitch('versions', startTime, { fromTab: 'overview' });
 * ```
 */
export function measureTabSwitch(
  tabName: string,
  startTime: number,
  metadata?: Record<string, string | number>
): void {
  const duration = performance.now() - startTime;
  const exceeded = duration > PERFORMANCE_BUDGETS.TAB_SWITCH;

  // Track via telemetry
  trackEvent('tab_switch_performance', {
    tab_name: tabName,
    duration_ms: Math.round(duration),
    budget_exceeded: exceeded,
    budget_ms: PERFORMANCE_BUDGETS.TAB_SWITCH,
    ...metadata,
  });

  // Warn in development if budget exceeded
  if (process.env.NODE_ENV === 'development' && exceeded) {
    console.warn(
      `[Performance] Tab switch to "${tabName}" took ${Math.round(duration)}ms (budget: ${PERFORMANCE_BUDGETS.TAB_SWITCH}ms)`,
      metadata
    );
  }
}

/**
 * Measure component render performance
 * Useful for tracking heavy components
 *
 * @param componentName - Name of the component
 * @param startTime - Performance.now() timestamp when render started
 * @param phase - Render phase (mount, update, etc.)
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const startTime = performance.now();
 *   return () => {
 *     measureRender('VersionsPanel', startTime, 'mount');
 *   };
 * }, []);
 * ```
 */
export function measureRender(
  componentName: string,
  startTime: number,
  phase: 'mount' | 'update' | 'unmount' = 'mount'
): void {
  const duration = performance.now() - startTime;
  const exceeded = duration > PERFORMANCE_BUDGETS.INITIAL_RENDER;

  trackEvent('component_render_performance', {
    component_name: componentName,
    phase,
    duration_ms: Math.round(duration),
    budget_exceeded: exceeded,
    budget_ms: PERFORMANCE_BUDGETS.INITIAL_RENDER,
  });

  if (process.env.NODE_ENV === 'development' && exceeded) {
    console.warn(
      `[Performance] ${componentName} ${phase} took ${Math.round(duration)}ms (budget: ${PERFORMANCE_BUDGETS.INITIAL_RENDER}ms)`
    );
  }
}

/**
 * Measure data fetch performance
 * Tracks query latency and warns on slow fetches
 *
 * @param queryName - Name of the query
 * @param startTime - Performance.now() timestamp when fetch started
 * @param metadata - Additional context (cache hit, error, etc.)
 *
 * @example
 * ```tsx
 * const startTime = performance.now();
 * const data = await fetch('/api/versions');
 * measureDataFetch('versions', startTime, { cacheHit: false });
 * ```
 */
export function measureDataFetch(
  queryName: string,
  startTime: number,
  metadata?: {
    cacheHit?: boolean;
    error?: boolean;
    itemCount?: number;
  }
): void {
  const duration = performance.now() - startTime;
  const exceeded = duration > PERFORMANCE_BUDGETS.DATA_FETCH;

  trackEvent('data_fetch_performance', {
    query_name: queryName,
    duration_ms: Math.round(duration),
    budget_exceeded: exceeded,
    budget_ms: PERFORMANCE_BUDGETS.DATA_FETCH,
    cache_hit: metadata?.cacheHit ?? false,
    error: metadata?.error ?? false,
    item_count: metadata?.itemCount,
  });

  if (process.env.NODE_ENV === 'development' && exceeded) {
    console.warn(
      `[Performance] Query "${queryName}" took ${Math.round(duration)}ms (budget: ${PERFORMANCE_BUDGETS.DATA_FETCH}ms)`,
      metadata
    );
  }
}

/**
 * Mark performance timing for PerformanceObserver
 * Useful for Core Web Vitals tracking
 *
 * @param markName - Name of the performance mark
 * @param detail - Additional detail for the mark
 *
 * @example
 * ```tsx
 * markPerformance('tab-switch-start');
 * // ... operation ...
 * markPerformance('tab-switch-end');
 * performance.measure('tab-switch', 'tab-switch-start', 'tab-switch-end');
 * ```
 */
export function markPerformance(
  markName: string,
  detail?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined' && window.performance?.mark) {
    try {
      window.performance.mark(markName, { detail });
    } catch (error) {
      // Silently fail in browsers that don't support detail
      window.performance.mark(markName);
    }
  }
}

/**
 * Measure between two performance marks
 *
 * @param measureName - Name for the measurement
 * @param startMark - Start mark name
 * @param endMark - End mark name
 * @returns Duration in milliseconds, or null if measurement failed
 *
 * @example
 * ```tsx
 * markPerformance('data-fetch-start');
 * const data = await fetchData();
 * markPerformance('data-fetch-end');
 * const duration = measureBetweenMarks('data-fetch', 'data-fetch-start', 'data-fetch-end');
 * ```
 */
export function measureBetweenMarks(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window === 'undefined' || !window.performance?.measure) {
    return null;
  }

  try {
    const measure = window.performance.measure(measureName, startMark, endMark);
    return measure.duration;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to measure between marks: ${startMark} -> ${endMark}`, error);
    }
    return null;
  }
}

/**
 * Create a performance monitor effect for component mount/unmount tracking
 * Returns a cleanup function to measure render time
 *
 * @param componentName - Name of the component
 * @returns Cleanup function for useEffect
 *
 * @example
 * ```tsx
 * function MyPanel() {
 *   useEffect(createPerformanceMonitor('MyPanel'), []);
 *   return <div>...</div>;
 * }
 * ```
 */
export function createPerformanceMonitor(componentName: string): () => () => void {
  return () => {
    if (typeof window === 'undefined') return () => {};

    const startTime = performance.now();

    // Return cleanup function to track mount time
    return () => {
      measureRender(componentName, startTime, 'mount');
    };
  };
}
