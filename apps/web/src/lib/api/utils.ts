/**
 * API Utilities
 * Shared helper functions for API operations
 */

/**
 * Helper to download a file blob
 * Creates a temporary anchor element and triggers download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

/**
 * Extract filename from Content-Disposition header
 */
export function getFilenameFromHeaders(
  headers: Record<string, string | string[] | undefined> | any,
  defaultFilename: string
): string {
  const contentDisposition = headers['content-disposition'];

  if (!contentDisposition) {
    return defaultFilename;
  }

  const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
  if (matches?.[1]) {
    return matches[1].replace(/['"]/g, '');
  }

  return defaultFilename;
}
