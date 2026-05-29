export function getErrorMessage(error: unknown, fallback = 'Unknown error') {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
