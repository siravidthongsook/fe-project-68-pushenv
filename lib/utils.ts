export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function safeArray<T>(value: T[] | undefined | null) {
  return Array.isArray(value) ? value : [];
}
