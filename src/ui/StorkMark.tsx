// Placeholder mascot mark: a stylised stork head in profile (original artwork, see ATTRIBUTION.md).
export function StorkMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="var(--primary)" />
      <path d="M18 46c0-14 6-24 16-24 6 0 10 4 10 9 0 4-3 7-7 8l-9 2c-4 1-6 3-6 5z" fill="#fff" />
      <path d="M43 29l15 5-15 2z" fill="var(--accent)" />
      <circle cx="37" cy="29" r="2.2" fill="#1b1f24" />
    </svg>
  );
}
