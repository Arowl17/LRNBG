import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renders paragraphs, lists, bold and italic', () => {
    const { container } = render(
      <Markdown text={'First **bold** and *it*.\nSame paragraph.\n\n- one\n- two'} />,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('it').tagName).toBe('EM');
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.textContent).toContain('Same paragraph.');
  });
});
