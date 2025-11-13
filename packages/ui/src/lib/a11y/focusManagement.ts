/**
 * Focus Management Utilities for WCAG 2.1 AA Compliance
 *
 * Provides utilities for managing focus in complex UI components,
 * including focus trapping, restoration, and keyboard navigation.
 */

import { RefObject, useCallback, useEffect, useRef } from 'react'

/**
 * Elements that can receive focus
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]:not([disabled])',
  '[role="menuitem"]:not([disabled])',
  '[role="option"]:not([disabled])',
].join(', ')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []

  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]
  return elements.filter(element => {
    // Check if element is visible and not disabled
    const style = window.getComputedStyle(element)
    return (
      element.offsetParent !== null && // Not hidden with display: none
      style.visibility !== 'hidden' && // Not hidden with visibility: hidden
      style.opacity !== '0' && // Not transparent
      !element.hasAttribute('disabled') && // Not disabled
      element.tabIndex !== -1 // Not excluded from tab order
    )
  })
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirst(container: HTMLElement | null): boolean {
  const focusableElements = getFocusableElements(container)
  if (focusableElements.length > 0) {
    focusableElements[0]?.focus()
    return true
  }
  return false
}

/**
 * Focus the last focusable element in a container
 */
export function focusLast(container: HTMLElement | null): boolean {
  const focusableElements = getFocusableElements(container)
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1]?.focus()
    return true
  }
  return false
}

/**
 * Hook for focus trap management
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean = true
) {
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!isActive || !container) return

    // Store the element that had focus before the trap was activated
    previousActiveElement.current = document.activeElement

    // Focus the first element in the container
    const focusableElements = getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const currentElement = document.activeElement as HTMLElement

      if (event.shiftKey) {
        // Shift + Tab: move focus backward
        if (currentElement === firstElement || !focusableElements.includes(currentElement)) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: move focus forward
        if (currentElement === lastElement || !focusableElements.includes(currentElement)) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Add event listener to the document to catch all tab key presses
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus to the previous element when the trap is deactivated
      if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus()
      }
    }
  }, [containerRef, isActive])

  return {
    restoreFocus: useCallback(() => {
      if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus()
      }
    }, []),
  }
}

/**
 * Hook for focus management with arrow key navigation
 */
export function useArrowNavigation(
  containerRef: RefObject<HTMLElement>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
    selector?: string
  } = {}
) {
  const {
    orientation = 'both',
    loop = true,
    selector = FOCUSABLE_SELECTOR,
  } = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
        return
      }

      const focusableElements = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

      if (currentIndex === -1) return

      let nextIndex: number

      switch (key) {
        case 'Home':
          event.preventDefault()
          nextIndex = 0
          break

        case 'End':
          event.preventDefault()
          nextIndex = focusableElements.length - 1
          break

        case 'ArrowUp':
          if (orientation === 'horizontal') return
          event.preventDefault()
          nextIndex = currentIndex - 1
          if (nextIndex < 0) {
            nextIndex = loop ? focusableElements.length - 1 : 0
          }
          break

        case 'ArrowDown':
          if (orientation === 'horizontal') return
          event.preventDefault()
          nextIndex = currentIndex + 1
          if (nextIndex >= focusableElements.length) {
            nextIndex = loop ? 0 : focusableElements.length - 1
          }
          break

        case 'ArrowLeft':
          if (orientation === 'vertical') return
          event.preventDefault()
          nextIndex = currentIndex - 1
          if (nextIndex < 0) {
            nextIndex = loop ? focusableElements.length - 1 : 0
          }
          break

        case 'ArrowRight':
          if (orientation === 'vertical') return
          event.preventDefault()
          nextIndex = currentIndex + 1
          if (nextIndex >= focusableElements.length) {
            nextIndex = loop ? 0 : focusableElements.length - 1
          }
          break

        default:
          return
      }

      if (focusableElements[nextIndex]) {
        focusableElements[nextIndex]?.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, orientation, loop, selector])
}

/**
 * Hook to manage focus indicators for high visibility
 */
export function useFocusVisible() {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    let hadKeyboardEvent = true
    let keyboardThrottleTimeout = 0

    const handlePointerDown = () => {
      hadKeyboardEvent = false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return
      }

      clearTimeout(keyboardThrottleTimeout)
      hadKeyboardEvent = true

      // Throttle updates for performance
      keyboardThrottleTimeout = window.setTimeout(() => {
        hadKeyboardEvent = true
      }, 100)
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      if (hadKeyboardEvent || target.matches(':focus-visible')) {
        target.classList.add('focus-visible')
      }
    }

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      target.classList.remove('focus-visible')
    }

    // Add global event listeners
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handlePointerDown, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('touchstart', handlePointerDown, true)
    document.addEventListener('focus', handleFocus, true)
    document.addEventListener('blur', handleBlur, true)

    return () => {
      clearTimeout(keyboardThrottleTimeout)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handlePointerDown, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('touchstart', handlePointerDown, true)
      document.removeEventListener('focus', handleFocus, true)
      document.removeEventListener('blur', handleBlur, true)
    }
  }, [])
}

/**
 * Hook for skip links to main content areas
 */
export function useSkipLinks(skipTargets: Array<{ id: string; label: string }>) {
  useEffect(() => {
    // Create skip links container if it doesn't exist
    let skipLinksContainer = document.getElementById('skip-links')
    if (!skipLinksContainer) {
      skipLinksContainer = document.createElement('div')
      skipLinksContainer.id = 'skip-links'
      skipLinksContainer.className = 'sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50'
      document.body.insertBefore(skipLinksContainer, document.body.firstChild)
    }

    // Clear existing skip links
    skipLinksContainer.innerHTML = ''

    // Add skip links for each target
    skipTargets.forEach(({ id, label }) => {
      const skipLink = document.createElement('a')
      skipLink.href = `#${id}`
      skipLink.textContent = `Skip to ${label}`
      skipLink.className = 'block bg-primary text-primary-foreground px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring'

      skipLink.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.getElementById(id)
        if (target) {
          target.focus({ preventScroll: false })
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })

      skipLinksContainer!.appendChild(skipLink)
    })

    return () => {
      // Clean up skip links when component unmounts
      if (skipLinksContainer && skipLinksContainer.parentNode) {
        skipLinksContainer.parentNode.removeChild(skipLinksContainer)
      }
    }
  }, [skipTargets])
}
