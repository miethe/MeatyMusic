/**
 * Keyboard Navigation Hooks for WCAG 2.1 AA Compliance
 *
 * Provides comprehensive keyboard navigation patterns including:
 * - Arrow key navigation for lists and grids
 * - Tab navigation with roving tabindex
 * - Escape key handling for modals and dropdowns
 * - Enter/Space activation patterns
 * - Search navigation with slash key shortcuts
 */

import { RefObject, useCallback, useEffect, useState } from 'react'

export interface KeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'grid'
  wrap?: boolean
  homeEndKeys?: boolean
  typeAhead?: boolean
  skipDisabled?: boolean
  selector?: string
}

/**
 * Hook for comprehensive keyboard navigation in lists and grids
 */
export function useKeyboardNavigation(
  containerRef: RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    orientation = 'vertical',
    wrap = true,
    homeEndKeys = true,
    typeAhead = false,
    skipDisabled = true,
    selector = '[role="option"], [role="menuitem"], [role="gridcell"], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  } = options

  const [activeIndex, setActiveIndex] = useState(0)
  const [typeAheadString, setTypeAheadString] = useState('')
  const [typeAheadTimeout, setTypeAheadTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const getNavigableElements = useCallback(() => {
    const container = containerRef.current
    if (!container) return []

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
    return skipDisabled
      ? elements.filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-disabled'))
      : elements
  }, [containerRef, selector, skipDisabled])

  const moveToIndex = useCallback((index: number) => {
    const elements = getNavigableElements()
    if (elements.length === 0) return

    const clampedIndex = Math.max(0, Math.min(index, elements.length - 1))
    const targetElement = elements[clampedIndex]

    if (targetElement) {
      targetElement.focus()
      setActiveIndex(clampedIndex)
    }
  }, [getNavigableElements])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, target } = event
    const elements = getNavigableElements()

    if (elements.length === 0) return

    const currentIndex = elements.indexOf(target as HTMLElement)
    if (currentIndex === -1) return

    let nextIndex = currentIndex

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'horizontal') return
        event.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= elements.length) {
          nextIndex = wrap ? 0 : elements.length - 1
        }
        break

      case 'ArrowUp':
        if (orientation === 'horizontal') return
        event.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = wrap ? elements.length - 1 : 0
        }
        break

      case 'ArrowRight':
        if (orientation === 'vertical') return
        event.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= elements.length) {
          nextIndex = wrap ? 0 : elements.length - 1
        }
        break

      case 'ArrowLeft':
        if (orientation === 'vertical') return
        event.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = wrap ? elements.length - 1 : 0
        }
        break

      case 'Home':
        if (!homeEndKeys) return
        event.preventDefault()
        nextIndex = 0
        break

      case 'End':
        if (!homeEndKeys) return
        event.preventDefault()
        nextIndex = elements.length - 1
        break

      case 'Enter':
      case ' ':
        // Let the element handle its own activation
        return

      case 'Escape':
        // Bubble up escape for parent components to handle
        return

      default:
        // Handle type-ahead
        if (typeAhead && key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
          event.preventDefault()
          handleTypeAhead(key, elements, currentIndex)
          return
        }
        return
    }

    if (nextIndex !== currentIndex && elements[nextIndex]) {
      moveToIndex(nextIndex)
    }
  }, [getNavigableElements, orientation, wrap, homeEndKeys, typeAhead, moveToIndex])

  const handleTypeAhead = useCallback((char: string, elements: HTMLElement[], currentIndex: number) => {
    // Clear existing timeout
    if (typeAheadTimeout) {
      clearTimeout(typeAheadTimeout)
    }

    // Update type-ahead string
    const newTypeAheadString = typeAheadString + char.toLowerCase()
    setTypeAheadString(newTypeAheadString)

    // Find matching element
    const startIndex = currentIndex + 1
    const searchElements = [...elements.slice(startIndex), ...elements.slice(0, startIndex)]

    const matchingElement = searchElements.find(el => {
      const text = el.textContent?.toLowerCase() || ''
      return text.startsWith(newTypeAheadString)
    })

    if (matchingElement) {
      const matchingIndex = elements.indexOf(matchingElement)
      moveToIndex(matchingIndex)
    }

    // Set timeout to clear type-ahead string
    const timeout = setTimeout(() => {
      setTypeAheadString('')
    }, 1000)
    setTypeAheadTimeout(timeout)
  }, [typeAheadString, typeAheadTimeout, moveToIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      if (typeAheadTimeout) {
        clearTimeout(typeAheadTimeout)
      }
    }
  }, [containerRef, handleKeyDown, typeAheadTimeout])

  return {
    activeIndex,
    moveToIndex,
    getNavigableElements,
  }
}

/**
 * Hook for escape key handling (modals, dropdowns, etc.)
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [handler, enabled])
}

/**
 * Hook for global keyboard shortcuts
 */
export function useGlobalKeyboardShortcuts(shortcuts: Array<{
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  handler: () => void
  description: string
  enabled?: boolean
}>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const modifiersMatch = (shortcut.modifiers || []).every(modifier => {
          switch (modifier) {
            case 'ctrl': return event.ctrlKey
            case 'shift': return event.shiftKey
            case 'alt': return event.altKey
            case 'meta': return event.metaKey
            default: return false
          }
        })

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatches && modifiersMatch) {
          // Don't trigger shortcuts when typing in inputs
          const target = event.target as HTMLElement
          if (target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.contentEditable === 'true'
          )) {
            // Allow some shortcuts even in inputs (like Escape)
            if (shortcut.key !== 'Escape') {
              continue
            }
          }

          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

/**
 * Hook for search navigation with slash key shortcut
 */
export function useSearchNavigation(
  searchInputRef: RefObject<HTMLInputElement>,
  options: {
    enabled?: boolean
    slashKey?: boolean
    escapeKey?: boolean
  } = {}
) {
  const { enabled = true, slashKey = true, escapeKey = true } = options

  const focusSearch = useCallback(() => {
    const searchInput = searchInputRef.current
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }, [searchInputRef])

  const clearSearch = useCallback(() => {
    const searchInput = searchInputRef.current
    if (searchInput) {
      searchInput.value = ''
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
      searchInput.blur()
    }
  }, [searchInputRef])

  useGlobalKeyboardShortcuts([
    {
      key: '/',
      handler: focusSearch,
      description: 'Focus search input',
      enabled: enabled && slashKey,
    },
    {
      key: 'Escape',
      handler: clearSearch,
      description: 'Clear search and unfocus',
      enabled: enabled && escapeKey,
    },
  ])

  return {
    focusSearch,
    clearSearch,
  }
}

/**
 * Hook for roving tabindex pattern
 */
export function useRovingTabindex(
  containerRef: RefObject<HTMLElement>,
  options: {
    selector?: string
    defaultIndex?: number
  } = {}
) {
  const { selector = '[role="option"], [role="menuitem"]', defaultIndex = 0 } = options
  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[]

    // Set tabindex for all elements
    elements.forEach((element, index) => {
      element.tabIndex = index === activeIndex ? 0 : -1
    })
  }, [containerRef, selector, activeIndex])

  const setActive = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
    if (index >= 0 && index < elements.length) {
      setActiveIndex(index)
      elements[index].focus()
    }
  }, [containerRef, selector])

  return {
    activeIndex,
    setActive,
  }
}

/**
 * Hook for menu navigation patterns (similar to ARIA menu)
 */
export function useMenuNavigation(
  containerRef: RefObject<HTMLElement>,
  options: {
    onItemSelect?: (index: number) => void
    onClose?: () => void
    closeOnSelect?: boolean
  } = {}
) {
  const { onItemSelect, onClose, closeOnSelect = true } = options

  const { activeIndex, moveToIndex } = useKeyboardNavigation(containerRef, {
    orientation: 'vertical',
    wrap: true,
    homeEndKeys: true,
    typeAhead: true,
    selector: '[role="menuitem"]',
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event

      if (key === 'Enter' || key === ' ') {
        event.preventDefault()
        if (onItemSelect) {
          onItemSelect(activeIndex)
        }
        if (closeOnSelect && onClose) {
          onClose()
        }
      } else if (key === 'Escape') {
        event.preventDefault()
        if (onClose) {
          onClose()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, activeIndex, onItemSelect, onClose, closeOnSelect])

  return {
    activeIndex,
    moveToIndex,
  }
}
