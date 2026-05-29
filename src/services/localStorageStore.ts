export function readStoredJson<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
