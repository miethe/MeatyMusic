/**
 * Formats a date for display in tooltips and UI elements
 * Format: "Jan 10, 2025 at 3:45 PM"
 */
export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return formatter.format(date).replace(',', ' at');
}
