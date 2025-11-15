/**
 * Toaster Component
 * Global toast notification container using sonner
 *
 * Add this component once at the root of your app (in layout.tsx)
 * to enable toast notifications throughout the application.
 *
 * Phase 4, Task 4.3
 */

'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toaster Props
 */
export interface ToasterProps {
  /** Position of toast notifications */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Theme */
  theme?: 'light' | 'dark' | 'system';
  /** Rich colors for different toast types */
  richColors?: boolean;
  /** Expand toasts by default */
  expand?: boolean;
  /** Close button on toasts */
  closeButton?: boolean;
}

/**
 * Toaster Component
 *
 * Global container for toast notifications.
 * Should be placed in the root layout component.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Toaster({
  position = 'bottom-right',
  theme = 'system',
  richColors = true,
  expand = false,
  closeButton = true,
}: ToasterProps = {}): JSX.Element {
  return (
    <SonnerToaster
      position={position}
      theme={theme}
      richColors={richColors}
      expand={expand}
      closeButton={closeButton}
      toastOptions={{
        classNames: {
          toast: 'rounded-lg shadow-lg',
          title: 'font-medium',
          description: 'text-sm opacity-90',
          actionButton: 'rounded-md bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton: 'rounded-md bg-muted text-muted-foreground hover:bg-muted/80',
          closeButton: 'rounded-md hover:bg-muted',
        },
      }}
    />
  );
}

/**
 * Default export
 */
export default Toaster;
