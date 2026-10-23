export function releaseYear(value: string | null | undefined): string {
  return value ? String(value).slice(0, 4) : 'TBA';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Release date TBA';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
}

export function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatRating(value: number | null | undefined): string {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating.toFixed(1) : '—';
}
