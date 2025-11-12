import DOMPurify from 'dompurify';

export function sanitizeHtml(dirtyHtml: string): string {
  return DOMPurify.sanitize(dirtyHtml);
}
