'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  mobileBreakpoint?: number;
  transitionDuration?: number;
  position?: 'left' | 'right';
  width?: number;
  mobileWidth?: number;
  collapsible?: boolean;
  overlay?: boolean;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({
    children,
    className,
    isOpen = true,
    onOpenChange,
    mobileBreakpoint = 768,
    transitionDuration = 250, // MP-SBR-SYS-004: Smooth transitions
    position = 'left',
    width = 260, // MP-SBR-SYS-004: Desktop default width
    mobileWidth = 320, // MP-SBR-SYS-004: Mobile default width
    collapsible = false,
    overlay = true,
    ...props
  }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const sidebarRef = useRef<HTMLElement | null>(null);
    const focusTrapRef = useRef<HTMLElement | null>(null);

    // Handle responsive breakpoint
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < mobileBreakpoint);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, [mobileBreakpoint]);

    // Handle focus trapping on mobile when open
    useEffect(() => {
      if (!isMobile || !isOpen || !focusTrapRef.current) return;

      const sidebar = focusTrapRef.current;
      const focusableElements = sidebar.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      };

      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onOpenChange) {
          onOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleEscapeKey);

      // Focus first element when opening
      setTimeout(() => {
        firstFocusable?.focus();
      }, transitionDuration);

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }, [isMobile, isOpen, transitionDuration, onOpenChange]);

    // Handle transition states
    useEffect(() => {
      if (isTransitioning) {
        const timer = setTimeout(() => {
          setIsTransitioning(false);
        }, transitionDuration);
        return () => clearTimeout(timer);
      }
    }, [isTransitioning, transitionDuration]);

    const handleToggle = () => {
      setIsTransitioning(true);
      onOpenChange?.(!isOpen);
    };

    const sidebarWidth = isMobile ? mobileWidth : width;
    const isEmpty = !children || (React.Children.count(children) === 0);

    const sidebarStyles = {
      '--sidebar-width': `${sidebarWidth}px`,
      '--transition-duration': `${transitionDuration}ms`,
    } as React.CSSProperties;

    const sidebarClasses = cn(
      // Base styles
      'flex flex-col bg-sidebar-background border-r border-border',
      'transition-all duration-[var(--transition-duration)] ease-in-out',
      // Performance optimization for smooth transitions (MP-SBR-SYS-004)
      'will-change-[width,transform] contain-layout contain-style',

      // Width and position
      position === 'left' ? 'border-r' : 'border-l',

      // Desktop styles
      !isMobile && [
        isOpen ? 'w-[var(--sidebar-width)]' : collapsible ? 'w-0' : 'w-[var(--sidebar-width)]',
        isEmpty && 'w-0',
      ],

      // Mobile styles
      isMobile && [
        'fixed inset-y-0 z-50 w-[var(--sidebar-width)]',
        position === 'left' ? 'left-0' : 'right-0',
        isOpen ? 'translate-x-0' :
          position === 'left' ? '-translate-x-full' : 'translate-x-full',
        'shadow-lg',
      ],

      // Transition states
      isTransitioning && 'opacity-50',

      className
    );

    // Mobile backdrop
    const backdrop = isMobile && overlay && isOpen && (
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
    );

    return (
      <>
        {backdrop}
        <aside
          {...props}
          ref={(node) => {
            if (sidebarRef.current !== node) {
              sidebarRef.current = node;
            }
            if (focusTrapRef.current !== node) {
              focusTrapRef.current = node;
            }
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref && 'current' in ref) {
              (ref as React.MutableRefObject<HTMLElement | null>).current = node;
            }
          }}
          role="complementary"
          aria-hidden={isEmpty ? 'true' : 'false'}
          aria-label="Sidebar"
          className={sidebarClasses}
          style={sidebarStyles}
          data-sidebar-open={isOpen}
          data-sidebar-mobile={isMobile}
          data-sidebar-transitioning={isTransitioning}
          data-sidebar-empty={isEmpty}
        >
          {!isEmpty && children}
        </aside>
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';
