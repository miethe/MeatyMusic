import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import { createRef } from 'react'
import {
  getFocusableElements,
  focusFirst,
  focusLast,
  useFocusTrap,
  useArrowNavigation,
  useFocusVisible,
  useSkipLinks,
} from '../focusManagement'

describe('focusManagement', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getFocusableElements', () => {
    it('should find focusable elements', () => {
      const container = document.createElement('div')
      const button = document.createElement('button')
      const input = document.createElement('input')
      const disabledButton = document.createElement('button')
      const hiddenInput = document.createElement('input')

      button.textContent = 'Click me'
      input.type = 'text'
      disabledButton.disabled = true
      hiddenInput.style.display = 'none'

      container.appendChild(button)
      container.appendChild(input)
      container.appendChild(disabledButton)
      container.appendChild(hiddenInput)
      document.body.appendChild(container)

      const focusableElements = getFocusableElements(container)

      expect(focusableElements).toHaveLength(2)
      expect(focusableElements).toContain(button)
      expect(focusableElements).toContain(input)
      expect(focusableElements).not.toContain(disabledButton)
      expect(focusableElements).not.toContain(hiddenInput)
    })

    it('should return empty array for null container', () => {
      const focusableElements = getFocusableElements(null)
      expect(focusableElements).toEqual([])
    })

    it('should filter elements with tabindex -1', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'Focusable'
      button2.textContent = 'Not focusable'
      button2.tabIndex = -1

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const focusableElements = getFocusableElements(container)

      expect(focusableElements).toHaveLength(1)
      expect(focusableElements).toContain(button1)
      expect(focusableElements).not.toContain(button2)
    })
  })

  describe('focusFirst', () => {
    it('should focus the first focusable element', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'First'
      button2.textContent = 'Second'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const result = focusFirst(container)

      expect(result).toBe(true)
      expect(document.activeElement).toBe(button1)
    })

    it('should return false if no focusable elements', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const result = focusFirst(container)

      expect(result).toBe(false)
    })
  })

  describe('focusLast', () => {
    it('should focus the last focusable element', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'First'
      button2.textContent = 'Last'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const result = focusLast(container)

      expect(result).toBe(true)
      expect(document.activeElement).toBe(button2)
    })

    it('should return false if no focusable elements', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const result = focusLast(container)

      expect(result).toBe(false)
    })
  })

  describe('useFocusTrap', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')
      const button3 = document.createElement('button')

      button1.textContent = 'First'
      button2.textContent = 'Middle'
      button3.textContent = 'Last'

      container.appendChild(button1)
      container.appendChild(button2)
      container.appendChild(button3)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() => useFocusTrap(containerRef, true))

      // Should focus first element on activation
      expect(document.activeElement).toBe(button1)

      // Simulate Tab from last element (should wrap to first)
      button3.focus()
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      })

      fireEvent(document, tabEvent)

      expect(document.activeElement).toBe(button1)
    })

    it('should handle Shift+Tab to move backward', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'First'
      button2.textContent = 'Last'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() => useFocusTrap(containerRef, true))

      // Simulate Shift+Tab from first element (should wrap to last)
      button1.focus()
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      })

      fireEvent(document, shiftTabEvent)

      expect(document.activeElement).toBe(button2)
    })

    it('should not trap focus when disabled', () => {
      const container = document.createElement('div')
      const button = document.createElement('button')

      container.appendChild(button)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() => useFocusTrap(containerRef, false))

      // Should not focus any element
      expect(document.activeElement).toBe(document.body)
    })

    it('should restore focus on cleanup', () => {
      const outsideButton = document.createElement('button')
      outsideButton.textContent = 'Outside'
      document.body.appendChild(outsideButton)
      outsideButton.focus()

      const container = document.createElement('div')
      const insideButton = document.createElement('button')
      insideButton.textContent = 'Inside'

      container.appendChild(insideButton)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      const { result, unmount } = renderHook(() => useFocusTrap(containerRef, true))

      // Focus should be trapped inside
      expect(document.activeElement).toBe(insideButton)

      // Unmount should restore focus
      unmount()

      expect(document.activeElement).toBe(outsideButton)
    })
  })

  describe('useArrowNavigation', () => {
    it('should handle vertical arrow navigation', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'First'
      button2.textContent = 'Second'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useArrowNavigation(containerRef, { orientation: 'vertical' })
      )

      button1.focus()

      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      })

      fireEvent(container, arrowDownEvent)

      expect(document.activeElement).toBe(button2)
    })

    it('should handle horizontal arrow navigation', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'First'
      button2.textContent = 'Second'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useArrowNavigation(containerRef, { orientation: 'horizontal' })
      )

      button1.focus()

      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      })

      fireEvent(container, arrowRightEvent)

      expect(document.activeElement).toBe(button2)
    })

    it('should handle Home and End keys', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')
      const button3 = document.createElement('button')

      container.appendChild(button1)
      container.appendChild(button2)
      container.appendChild(button3)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() => useArrowNavigation(containerRef))

      button2.focus()

      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
      })

      fireEvent(container, homeEvent)
      expect(document.activeElement).toBe(button1)

      // Test End key
      const endEvent = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
      })

      fireEvent(container, endEvent)
      expect(document.activeElement).toBe(button3)
    })

    it('should handle looping navigation', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useArrowNavigation(containerRef, {
          orientation: 'vertical',
          loop: true,
        })
      )

      button2.focus()

      // Navigate past last element should loop to first
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      })

      fireEvent(container, arrowDownEvent)

      expect(document.activeElement).toBe(button1)
    })
  })

  describe('useFocusVisible', () => {
    it('should add focus-visible class on keyboard focus', () => {
      renderHook(() => useFocusVisible())

      const button = document.createElement('button')
      button.textContent = 'Test'
      document.body.appendChild(button)

      // Simulate keyboard event first
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      })
      fireEvent(document, keyboardEvent)

      // Then focus
      const focusEvent = new FocusEvent('focus', {
        bubbles: true,
      })
      fireEvent(button, focusEvent)

      expect(button.classList.contains('focus-visible')).toBe(true)
    })

    it('should remove focus-visible class on blur', () => {
      renderHook(() => useFocusVisible())

      const button = document.createElement('button')
      button.textContent = 'Test'
      button.classList.add('focus-visible')
      document.body.appendChild(button)

      const blurEvent = new FocusEvent('blur', {
        bubbles: true,
      })
      fireEvent(button, blurEvent)

      expect(button.classList.contains('focus-visible')).toBe(false)
    })

    it('should not add focus-visible class on mouse focus', () => {
      renderHook(() => useFocusVisible())

      const button = document.createElement('button')
      button.textContent = 'Test'
      document.body.appendChild(button)

      // Simulate mouse event first
      const mouseEvent = new MouseEvent('mousedown', {
        bubbles: true,
      })
      fireEvent(document, mouseEvent)

      // Then focus
      const focusEvent = new FocusEvent('focus', {
        bubbles: true,
      })
      fireEvent(button, focusEvent)

      expect(button.classList.contains('focus-visible')).toBe(false)
    })
  })

  describe('useSkipLinks', () => {
    it('should create skip links', () => {
      const skipTargets = [
        { id: 'main-content', label: 'main content' },
        { id: 'navigation', label: 'navigation' },
      ]

      renderHook(() => useSkipLinks(skipTargets))

      const skipLinksContainer = document.getElementById('skip-links')
      expect(skipLinksContainer).toBeTruthy()

      const links = skipLinksContainer?.querySelectorAll('a')
      expect(links).toHaveLength(2)
      expect(links?.[0].textContent).toBe('Skip to main content')
      expect(links?.[0].href).toContain('#main-content')
    })

    it('should handle skip link clicks', () => {
      const mainContent = document.createElement('main')
      mainContent.id = 'main-content'
      mainContent.tabIndex = -1
      document.body.appendChild(mainContent)

      const skipTargets = [{ id: 'main-content', label: 'main content' }]

      renderHook(() => useSkipLinks(skipTargets))

      const skipLinksContainer = document.getElementById('skip-links')
      const link = skipLinksContainer?.querySelector('a')

      expect(link).toBeTruthy()

      // Mock scrollIntoView
      const scrollIntoViewMock = jest.fn()
      mainContent.scrollIntoView = scrollIntoViewMock

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
      })
      fireEvent(link!, clickEvent)

      expect(document.activeElement).toBe(mainContent)
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      })
    })

    it('should clean up skip links on unmount', () => {
      const skipTargets = [{ id: 'main-content', label: 'main content' }]

      const { unmount } = renderHook(() => useSkipLinks(skipTargets))

      expect(document.getElementById('skip-links')).toBeTruthy()

      unmount()

      expect(document.getElementById('skip-links')).toBeFalsy()
    })
  })
})
