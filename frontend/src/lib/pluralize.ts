/** Returns `singular` when count is exactly 1, otherwise `plural` (defaults to singular + "s"). */
export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
