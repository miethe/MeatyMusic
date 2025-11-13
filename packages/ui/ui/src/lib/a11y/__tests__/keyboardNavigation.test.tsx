import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRef } from 'react'
import {
  useKeyboardNavigation,
  useEscapeKey,
  useGlobalKeyboardShortcuts,
  useSearchNavigation,
  useRovingTabindex,
  useMenuNavigation,
} from '../keyboardNavigation'

// Mock setTimeout and clearTimeout
const mockSetTimeout = vi.fn()
const mockClearTimeout = vi.fn()

vi.stubGlobal('setTimeout', mockSetTimeout)
vi.stubGlobal('clearTimeout', mockClearTimeout)

describe('keyboardNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()

    // Mock setTimeout to execute immediately for testing
    mockSetTimeout.mockImplementation((callback: () => void) => {
      callback()
      return 123 // Mock timer ID
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useKeyboardNavigation', () => {
    it('should handle arrow key navigation', () => {
      // Create a container with navigable elements
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')
      const button3 = document.createElement('button')

      button1.textContent = 'Button 1'
      button2.textContent = 'Button 2'
      button3.textContent = 'Button 3'

      container.appendChild(button1)
      container.appendChild(button2)
      container.appendChild(button3)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      const { result } = renderHook(() =>
        useKeyboardNavigation(containerRef, { orientation: 'vertical' })
      )

      // Focus first button
      button1.focus()

      // Simulate ArrowDown key
      const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      })

      fireEvent(container, downEvent)

      expect(document.activeElement).toBe(button2)
    })

    it('should handle wrapping navigation', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'Button 1'
      button2.textContent = 'Button 2'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useKeyboardNavigation(containerRef, {
          orientation: 'vertical',
          wrap: true
        })
      )

      // Focus last button
      button2.focus()

      // Simulate ArrowDown key (should wrap to first)
      const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      })

      fireEvent(container, downEvent)

      expect(document.activeElement).toBe(button1)
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

      renderHook(() =>
        useKeyboardNavigation(containerRef, { homeEndKeys: true })
      )

      // Focus middle button
      button2.focus()

      // Simulate Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
      })

      fireEvent(container, homeEvent)
      expect(document.activeElement).toBe(button1)

      // Simulate End key
      const endEvent = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
      })

      fireEvent(container, endEvent)
      expect(document.activeElement).toBe(button3)
    })

    it('should handle type-ahead search', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')

      button1.textContent = 'Apple'
      button2.textContent = 'Banana'

      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useKeyboardNavigation(containerRef, { typeAhead: true })
      )

      // Focus first button
      button1.focus()

      // Type 'b' to search for "Banana"
      const typeEvent = new KeyboardEvent('keydown', {
        key: 'b',
        bubbles: true,
      })

      fireEvent(container, typeEvent)

      expect(document.activeElement).toBe(button2)
    })
  })

  describe('useEscapeKey', () => {
    it('should call handler on Escape key', () => {
      const handler = vi.fn()

      renderHook(() => useEscapeKey(handler, true))

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      })

      fireEvent(document, escapeEvent)

      expect(handler).toHaveBeenCalled()
    })

    it('should not call handler when disabled', () => {
      const handler = vi.fn()

      renderHook(() => useEscapeKey(handler, false))

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      })

      fireEvent(document, escapeEvent)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('useGlobalKeyboardShortcuts', () => {
    it('should handle keyboard shortcuts', () => {
      const handler = vi.fn()
      const shortcuts = [
        {
          key: 's',
          modifiers: ['ctrl'] as const,
          handler,
          description: 'Save',
        },
      ]

      renderHook(() => useGlobalKeyboardShortcuts(shortcuts))

      const ctrlSEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })

      fireEvent(document, ctrlSEvent)

      expect(handler).toHaveBeenCalled()
    })

    it('should ignore shortcuts in input elements', () => {
      const handler = vi.fn()
      const shortcuts = [
        {
          key: 's',
          modifiers: ['ctrl'] as const,
          handler,
          description: 'Save',
        },
      ]

      renderHook(() => useGlobalKeyboardShortcuts(shortcuts))

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const ctrlSEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })

      fireEvent(input, ctrlSEvent)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle disabled shortcuts', () => {
      const handler = vi.fn()
      const shortcuts = [
        {
          key: 's',
          modifiers: ['ctrl'] as const,
          handler,
          description: 'Save',
          enabled: false,
        },
      ]

      renderHook(() => useGlobalKeyboardShortcuts(shortcuts))

      const ctrlSEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })

      fireEvent(document, ctrlSEvent)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('useSearchNavigation', () => {
    it('should focus search input on slash key', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)

      const inputRef = createRef<HTMLInputElement>()
      Object.defineProperty(inputRef, 'current', {
        value: input,
        writable: false,
      })

      renderHook(() => useSearchNavigation(inputRef, { slashKey: true }))

      const slashEvent = new KeyboardEvent('keydown', {
        key: '/',
        bubbles: true,
      })

      fireEvent(document, slashEvent)

      expect(document.activeElement).toBe(input)
    })

    it('should clear search on escape', () => {
      const input = document.createElement('input')
      input.value = 'test search'
      document.body.appendChild(input)

      const inputRef = createRef<HTMLInputElement>()
      Object.defineProperty(inputRef, 'current', {
        value: input,
        writable: false,
      })

      const dispatchEventSpy = vi.spyOn(input, 'dispatchEvent')

      renderHook(() => useSearchNavigation(inputRef, { escapeKey: true }))

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      })

      fireEvent(document, escapeEvent)

      expect(input.value).toBe('')
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'input',
          bubbles: true,
        })
      )
    })
  })

  describe('useRovingTabindex', () => {
    it('should manage tabindex correctly', () => {
      const container = document.createElement('div')
      const option1 = document.createElement('div')
      const option2 = document.createElement('div')
      const option3 = document.createElement('div')

      option1.setAttribute('role', 'option')
      option2.setAttribute('role', 'option')
      option3.setAttribute('role', 'option')

      container.appendChild(option1)
      container.appendChild(option2)
      container.appendChild(option3)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      const { result } = renderHook(() =>
        useRovingTabindex(containerRef, { defaultIndex: 0 })
      )

      // Check initial tabindex values
      expect(option1.tabIndex).toBe(0)
      expect(option2.tabIndex).toBe(-1)
      expect(option3.tabIndex).toBe(-1)

      // Change active index
      result.current.setActive(1)

      expect(option1.tabIndex).toBe(-1)
      expect(option2.tabIndex).toBe(0)
      expect(option3.tabIndex).toBe(-1)
    })
  })

  describe('useMenuNavigation', () => {
    it('should handle menu item selection', () => {
      const onItemSelect = vi.fn()
      const onClose = vi.fn()

      const container = document.createElement('div')
      const menuitem1 = document.createElement('div')
      const menuitem2 = document.createElement('div')

      menuitem1.setAttribute('role', 'menuitem')
      menuitem2.setAttribute('role', 'menuitem')

      container.appendChild(menuitem1)
      container.appendChild(menuitem2)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useMenuNavigation(containerRef, {
          onItemSelect,
          onClose,
          closeOnSelect: true,
        })
      )

      // Focus first menu item
      menuitem1.focus()

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      })

      fireEvent(container, enterEvent)

      expect(onItemSelect).toHaveBeenCalledWith(0)
      expect(onClose).toHaveBeenCalled()
    })

    it('should handle menu close on Escape', () => {
      const onClose = vi.fn()

      const container = document.createElement('div')
      const menuitem1 = document.createElement('div')
      menuitem1.setAttribute('role', 'menuitem')
      container.appendChild(menuitem1)
      document.body.appendChild(container)

      const containerRef = createRef<HTMLDivElement>()
      Object.defineProperty(containerRef, 'current', {
        value: container,
        writable: false,
      })

      renderHook(() =>
        useMenuNavigation(containerRef, { onClose })
      )

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      })

      fireEvent(container, escapeEvent)

      expect(onClose).toHaveBeenCalled()
    })
  })
})
