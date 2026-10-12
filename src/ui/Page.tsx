import type { ReactNode } from 'react';

/** Standard page frame: a heading (the page's h1) and content. */
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-dashed border-border bg-surface p-6 text-center text-fg-muted">
      {children}
    </p>
  );
}
