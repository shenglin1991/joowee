export type Nullable<T> = T | null;

export function isNonNull<T>(value: Nullable<T> | undefined): value is T {
  return value !== null && value !== undefined;
}

