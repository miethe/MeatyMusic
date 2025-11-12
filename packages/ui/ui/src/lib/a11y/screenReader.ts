/**
 * Screen Reader Utilities for WCAG 2.1 AA Compliance
 *
 * Provides utilities for screen reader support including:
 * - Live region announcements
 * - Dynamic content updates
 * - Status announcements
 * - Loading state announcements
 * - Error message announcements
 */

import { useCallback, useEffect, useRef } from 'react'

export type AnnounceType = 'polite' | 'assertive' | 'off'
export type AnnouncePriority = 'low' | 'medium' | 'high'

/**
 * Create and manage live regions for screen reader announcements
 */
class LiveRegionManager {
  private regions: Map<AnnounceType, HTMLElement> = new Map()

  constructor() {
    this.createLiveRegions()
  }

  private createLiveRegions() {
    const regionTypes: AnnounceType[] = ['polite', 'assertive', 'off']

    regionTypes.forEach(type => {
      const region = document.createElement('div')
      region.setAttribute('aria-live', type)
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      region.id = `live-region-${type}`

      document.body.appendChild(region)
      this.regions.set(type, region)
    })
  }

  announce(message: string, type: AnnounceType = 'polite', delay = 100) {
    const region = this.regions.get(type)
    if (!region) return

    // Clear the region first to ensure the announcement is heard
    region.textContent = ''

    // Use a small delay to ensure screen readers pick up the change
    setTimeout(() => {
      region.textContent = message

      // Clear after a reasonable time to prevent accumulation
      setTimeout(() => {
        region.textContent = ''
      }, 5000)
    }, delay)
  }

  clear(type?: AnnounceType) {
    if (type) {
      const region = this.regions.get(type)
      if (region) {
        region.textContent = ''
      }
    } else {
      this.regions.forEach(region => {
        region.textContent = ''
      })
    }
  }

  destroy() {
    this.regions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region)
      }
    })
    this.regions.clear()
  }
}

// Global live region manager instance
let liveRegionManager: LiveRegionManager | null = null

/**
 * Get or create the global live region manager
 */
function getLiveRegionManager(): LiveRegionManager {
  if (!liveRegionManager) {
    liveRegionManager = new LiveRegionManager()
  }
  return liveRegionManager
}

/**
 * Hook for making screen reader announcements
 */
export function useAnnounce() {
  const announce = useCallback((
    message: string,
    type: AnnounceType = 'polite',
    options: {
      delay?: number
      clear?: boolean
    } = {}
  ) => {
    const { delay = 100, clear = false } = options
    const manager = getLiveRegionManager()

    if (clear) {
      manager.clear(type)
    }

    manager.announce(message, type, delay)
  }, [])

  const clearAnnouncements = useCallback((type?: AnnounceType) => {
    const manager = getLiveRegionManager()
    manager.clear(type)
  }, [])

  return { announce, clearAnnouncements }
}

/**
 * Hook for announcing loading states
 */
export function useLoadingAnnouncements() {
  const { announce } = useAnnounce()
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announceLoading = useCallback((
    message: string = 'Loading',
    options: {
      delay?: number
      timeout?: number
    } = {}
  ) => {
    const { delay = 500, timeout = 30000 } = options

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // Delay the loading announcement to avoid announcing for quick operations
    loadingTimeoutRef.current = setTimeout(() => {
      announce(message, 'polite')

      // Set a maximum timeout for loading announcements
      loadingTimeoutRef.current = setTimeout(() => {
        announce('Loading is taking longer than expected', 'polite')
      }, timeout)
    }, delay)
  }, [announce])

  const announceLoaded = useCallback((
    message: string,
    options: {
      includeResults?: boolean
      resultCount?: number
    } = {}
  ) => {
    const { includeResults = false, resultCount } = options

    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    let fullMessage = message
    if (includeResults && typeof resultCount === 'number') {
      fullMessage += `. ${resultCount} ${resultCount === 1 ? 'result' : 'results'} loaded.`
    }

    announce(fullMessage, 'polite')
  }, [announce])

  const clearLoadingAnnouncements = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearLoadingAnnouncements()
    }
  }, [clearLoadingAnnouncements])

  return {
    announceLoading,
    announceLoaded,
    clearLoadingAnnouncements,
  }
}

/**
 * Hook for announcing form validation errors
 */
export function useErrorAnnouncements() {
  const { announce } = useAnnounce()

  const announceError = useCallback((
    error: string | Error,
    options: {
      field?: string
      priority?: AnnouncePriority
    } = {}
  ) => {
    const { field, priority = 'high' } = options
    const errorMessage = error instanceof Error ? error.message : error

    let message = field ? `Error in ${field}: ${errorMessage}` : `Error: ${errorMessage}`

    // Add guidance for fixing the error
    message += '. Please review and try again.'

    const announceType: AnnounceType = priority === 'high' ? 'assertive' : 'polite'
    announce(message, announceType)
  }, [announce])

  const announceSuccess = useCallback((
    message: string,
    options: {
      action?: string
    } = {}
  ) => {
    const { action } = options
    let fullMessage = action ? `${action} successful` : 'Success'

    if (message) {
      fullMessage += `: ${message}`
    }

    announce(fullMessage, 'polite')
  }, [announce])

  const announceWarning = useCallback((
    message: string,
    options: {
      action?: string
    } = {}
  ) => {
    const { action } = options
    let fullMessage = action ? `${action} warning` : 'Warning'

    if (message) {
      fullMessage += `: ${message}`
    }

    announce(fullMessage, 'assertive')
  }, [announce])

  return {
    announceError,
    announceSuccess,
    announceWarning,
  }
}

/**
 * Hook for announcing search and filter results
 */
export function useSearchAnnouncements() {
  const { announce } = useAnnounce()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announceSearchResults = useCallback((
    resultCount: number,
    query: string,
    options: {
      delay?: number
      includeFilters?: boolean
      filterCount?: number
    } = {}
  ) => {
    const { delay = 500, includeFilters = false, filterCount } = options

    // Clear any existing timeout to debounce announcements
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      let message = `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`

      if (query) {
        message += ` found for "${query}"`
      }

      if (includeFilters && filterCount && filterCount > 0) {
        message += ` with ${filterCount} ${filterCount === 1 ? 'filter' : 'filters'} applied`
      }

      announce(message, 'polite')
    }, delay)
  }, [announce])

  const announceFilterChange = useCallback((
    filterName: string,
    action: 'applied' | 'removed' | 'changed',
    value?: string
  ) => {
    let message = `${filterName} filter ${action}`

    if (value) {
      message += `: ${value}`
    }

    announce(message, 'polite')
  }, [announce])

  const announceSearchClear = useCallback(() => {
    announce('Search cleared', 'polite')
  }, [announce])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return {
    announceSearchResults,
    announceFilterChange,
    announceSearchClear,
  }
}

/**
 * Hook for announcing selection changes
 */
export function useSelectionAnnouncements() {
  const { announce } = useAnnounce()

  const announceSelection = useCallback((
    itemName: string,
    action: 'selected' | 'deselected',
    options: {
      totalSelected?: number
      itemType?: string
    } = {}
  ) => {
    const { totalSelected, itemType = 'item' } = options

    let message = `${itemName} ${action}`

    if (typeof totalSelected === 'number') {
      message += `. ${totalSelected} ${itemType}${totalSelected !== 1 ? 's' : ''} selected in total.`
    }

    announce(message, 'polite')
  }, [announce])

  const announceMultipleSelection = useCallback((
    count: number,
    action: 'selected' | 'deselected',
    itemType: string = 'items'
  ) => {
    const message = `${count} ${itemType} ${action}`
    announce(message, 'polite')
  }, [announce])

  const announceSelectionClear = useCallback((
    itemType: string = 'items'
  ) => {
    const message = `All ${itemType} deselected`
    announce(message, 'polite')
  }, [announce])

  return {
    announceSelection,
    announceMultipleSelection,
    announceSelectionClear,
  }
}

/**
 * Generate accessible descriptions for complex UI elements
 */
export function generateAccessibleDescription(
  element: {
    name: string
    type?: string
    status?: string
    properties?: Record<string, any>
  },
  options: {
    includeInstructions?: boolean
    includeState?: boolean
  } = {}
): string {
  const { includeInstructions = true, includeState = true } = options
  const parts: string[] = []

  // Basic element description
  parts.push(element.name)

  if (element.type) {
    parts.push(`${element.type}`)
  }

  // Add status if available and requested
  if (includeState && element.status) {
    parts.push(`Status: ${element.status}`)
  }

  // Add key properties
  if (element.properties) {
    Object.entries(element.properties).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        parts.push(`${key}: ${value}`)
      }
    })
  }

  // Add interaction instructions
  if (includeInstructions) {
    parts.push('Use arrow keys to navigate, Enter or Space to select, Escape to close')
  }

  return parts.join('. ')
}

/**
 * Cleanup function for live region manager
 */
export function cleanupLiveRegions() {
  if (liveRegionManager) {
    liveRegionManager.destroy()
    liveRegionManager = null
  }
}
