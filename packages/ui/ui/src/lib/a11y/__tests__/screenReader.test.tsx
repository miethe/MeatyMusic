import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  useAnnounce,
  useLoadingAnnouncements,
  useErrorAnnouncements,
  useSearchAnnouncements,
  useSelectionAnnouncements,
  generateAccessibleDescription,
  cleanupLiveRegions,
} from '../screenReader'

// Mock setTimeout and clearTimeout
const mockSetTimeout = vi.fn()
const mockClearTimeout = vi.fn()

vi.stubGlobal('setTimeout', mockSetTimeout)
vi.stubGlobal('clearTimeout', mockClearTimeout)

describe('screenReader utilities', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = ''
    vi.clearAllMocks()

    // Mock setTimeout to execute immediately for testing
    mockSetTimeout.mockImplementation((callback: () => void) => {
      callback()
      return 123 // Mock timer ID
    })
  })

  afterEach(() => {
    cleanupLiveRegions()
    vi.clearAllMocks()
  })

  describe('useAnnounce', () => {
    it('should create live regions and make announcements', () => {
      const { result } = renderHook(() => useAnnounce())

      // Check that live regions are created
      expect(document.getElementById('live-region-polite')).toBeTruthy()
      expect(document.getElementById('live-region-assertive')).toBeTruthy()
      expect(document.getElementById('live-region-off')).toBeTruthy()

      // Make an announcement
      act(() => {
        result.current.announce('Test message', 'polite')
      })

      expect(mockSetTimeout).toHaveBeenCalled()

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Test message')
    })

    it('should clear announcements when requested', () => {
      const { result } = renderHook(() => useAnnounce())

      // Make an announcement first
      act(() => {
        result.current.announce('Test message', 'polite')
      })

      // Clear announcements
      act(() => {
        result.current.clearAnnouncements('polite')
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('')
    })

    it('should clear all announcements when no type specified', () => {
      const { result } = renderHook(() => useAnnounce())

      // Make announcements in multiple regions
      act(() => {
        result.current.announce('Polite message', 'polite')
        result.current.announce('Assertive message', 'assertive')
      })

      // Clear all announcements
      act(() => {
        result.current.clearAnnouncements()
      })

      const politeRegion = document.getElementById('live-region-polite')
      const assertiveRegion = document.getElementById('live-region-assertive')
      expect(politeRegion?.textContent).toBe('')
      expect(assertiveRegion?.textContent).toBe('')
    })
  })

  describe('useLoadingAnnouncements', () => {
    it('should announce loading state with delay', () => {
      const { result } = renderHook(() => useLoadingAnnouncements())

      act(() => {
        result.current.announceLoading('Loading models')
      })

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500)
    })

    it('should announce loaded state with result count', () => {
      const { result } = renderHook(() => useLoadingAnnouncements())

      act(() => {
        result.current.announceLoaded('Models loaded', {
          includeResults: true,
          resultCount: 5,
        })
      })

      expect(mockClearTimeout).toHaveBeenCalled()

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Models loaded. 5 results loaded.')
    })

    it('should handle singular result count', () => {
      const { result } = renderHook(() => useLoadingAnnouncements())

      act(() => {
        result.current.announceLoaded('Model loaded', {
          includeResults: true,
          resultCount: 1,
        })
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Model loaded. 1 result loaded.')
    })

    it('should clear loading timeouts on unmount', () => {
      const { result, unmount } = renderHook(() => useLoadingAnnouncements())

      act(() => {
        result.current.announceLoading()
      })

      unmount()

      expect(mockClearTimeout).toHaveBeenCalled()
    })
  })

  describe('useErrorAnnouncements', () => {
    it('should announce errors with assertive priority', () => {
      const { result } = renderHook(() => useErrorAnnouncements())

      act(() => {
        result.current.announceError('Network error', {
          field: 'model selection',
          priority: 'high',
        })
      })

      const assertiveRegion = document.getElementById('live-region-assertive')
      expect(assertiveRegion?.textContent).toBe(
        'Error in model selection: Network error. Please review and try again.'
      )
    })

    it('should announce errors from Error objects', () => {
      const { result } = renderHook(() => useErrorAnnouncements())
      const error = new Error('Validation failed')

      act(() => {
        result.current.announceError(error)
      })

      const assertiveRegion = document.getElementById('live-region-assertive')
      expect(assertiveRegion?.textContent).toBe(
        'Error: Validation failed. Please review and try again.'
      )
    })

    it('should announce success messages', () => {
      const { result } = renderHook(() => useErrorAnnouncements())

      act(() => {
        result.current.announceSuccess('Model saved', {
          action: 'Save',
        })
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Save successful: Model saved')
    })

    it('should announce warnings', () => {
      const { result } = renderHook(() => useErrorAnnouncements())

      act(() => {
        result.current.announceWarning('Model deprecated', {
          action: 'Selection',
        })
      })

      const assertiveRegion = document.getElementById('live-region-assertive')
      expect(assertiveRegion?.textContent).toBe('Selection warning: Model deprecated')
    })
  })

  describe('useSearchAnnouncements', () => {
    it('should announce search results with debouncing', () => {
      const { result } = renderHook(() => useSearchAnnouncements())

      act(() => {
        result.current.announceSearchResults(5, 'gpt', {
          delay: 100,
          includeFilters: true,
          filterCount: 2,
        })
      })

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100)
    })

    it('should handle singular result', () => {
      const { result } = renderHook(() => useSearchAnnouncements())

      act(() => {
        result.current.announceSearchResults(1, 'claude')
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('1 result found for "claude"')
    })

    it('should announce filter changes', () => {
      const { result } = renderHook(() => useSearchAnnouncements())

      act(() => {
        result.current.announceFilterChange('Provider', 'applied', 'OpenAI')
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Provider filter applied: OpenAI')
    })

    it('should announce search clear', () => {
      const { result } = renderHook(() => useSearchAnnouncements())

      act(() => {
        result.current.announceSearchClear()
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Search cleared')
    })

    it('should clear timeouts on unmount', () => {
      const { result, unmount } = renderHook(() => useSearchAnnouncements())

      act(() => {
        result.current.announceSearchResults(5, 'test')
      })

      unmount()

      expect(mockClearTimeout).toHaveBeenCalled()
    })
  })

  describe('useSelectionAnnouncements', () => {
    it('should announce selection with total count', () => {
      const { result } = renderHook(() => useSelectionAnnouncements())

      act(() => {
        result.current.announceSelection('GPT-4', 'selected', {
          totalSelected: 3,
          itemType: 'model',
        })
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('GPT-4 selected. 3 models selected in total.')
    })

    it('should handle singular selection', () => {
      const { result } = renderHook(() => useSelectionAnnouncements())

      act(() => {
        result.current.announceSelection('Claude', 'selected', {
          totalSelected: 1,
        })
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('Claude selected. 1 item selected in total.')
    })

    it('should announce multiple selection', () => {
      const { result } = renderHook(() => useSelectionAnnouncements())

      act(() => {
        result.current.announceMultipleSelection(5, 'selected', 'models')
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('5 models selected')
    })

    it('should announce selection clear', () => {
      const { result } = renderHook(() => useSelectionAnnouncements())

      act(() => {
        result.current.announceSelectionClear('models')
      })

      const politeRegion = document.getElementById('live-region-polite')
      expect(politeRegion?.textContent).toBe('All models deselected')
    })
  })

  describe('generateAccessibleDescription', () => {
    it('should generate basic description', () => {
      const element = {
        name: 'GPT-4',
        type: 'AI Model',
        status: 'active',
        properties: {
          provider: 'OpenAI',
          cost: 'High',
        },
      }

      const description = generateAccessibleDescription(element)

      expect(description).toBe(
        'GPT-4. AI Model. Status: active. provider: OpenAI. cost: High. Use arrow keys to navigate, Enter or Space to select, Escape to close'
      )
    })

    it('should generate description without state', () => {
      const element = {
        name: 'Claude',
        type: 'AI Model',
        status: 'active',
      }

      const description = generateAccessibleDescription(element, {
        includeState: false,
      })

      expect(description).toBe(
        'Claude. AI Model. Use arrow keys to navigate, Enter or Space to select, Escape to close'
      )
    })

    it('should generate description without instructions', () => {
      const element = {
        name: 'GPT-3.5',
        type: 'AI Model',
      }

      const description = generateAccessibleDescription(element, {
        includeInstructions: false,
      })

      expect(description).toBe('GPT-3.5. AI Model')
    })
  })

  describe('cleanupLiveRegions', () => {
    it('should remove live regions from DOM', () => {
      // First create live regions by using a hook
      const { unmount } = renderHook(() => useAnnounce())

      expect(document.getElementById('live-region-polite')).toBeTruthy()

      cleanupLiveRegions()

      expect(document.getElementById('live-region-polite')).toBeFalsy()
      expect(document.getElementById('live-region-assertive')).toBeFalsy()
      expect(document.getElementById('live-region-off')).toBeFalsy()
    })
  })
})
