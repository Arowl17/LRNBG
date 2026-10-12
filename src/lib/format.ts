const pad = (n: number) => String(n).padStart(2, '0');

/** European date format used everywhere in the UI: DD.MM.YYYY (local time). */
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** 24-hour time: HH:MM (local time). */
export function formatTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local calendar day key, YYYY-MM-DD — used for streaks (counted in the learner's timezone). */
export function localDayKey(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
