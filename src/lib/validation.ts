/**
 * Input validation helpers
 */
export const parsePositiveInt = (value: string | null, defaultValue?: number): number | undefined => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) return defaultValue;
  return parsed;
};
