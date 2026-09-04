import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BiotaLogo } from '../../components/ui/BiotaLogo';

describe('BiotaLogo', () => {
  it('renders the horizontal variant by default, with a span heading', () => {
    const { container } = render(<BiotaLogo />);

    const root = container.querySelector('[aria-label="BiotaGeom"]');
    const img = container.querySelector('img');
    const heading = screen.getByText('Geom').parentElement;

    expect(screen.getByText('PLATAFORMA ESG')).toBeInTheDocument();
    expect(root?.className).not.toContain('flex-col');
    expect(img?.className).toBe('size-8 shrink-0');
    expect(heading?.tagName).toBe('SPAN');
    expect(heading?.className).toContain('text-lg');
    expect(heading?.parentElement?.className).toContain('items-start');
    expect(screen.getByText('PLATAFORMA ESG').className).toContain(
      'text-[9px]'
    );
  });

  it('renders the stacked variant with an h1 heading and a custom tagline', () => {
    const { container } = render(
      <BiotaLogo
        nameAs="h1"
        tagline="Acesso Administrativo"
        variant="stacked"
      />
    );

    const root = container.querySelector('[aria-label="BiotaGeom"]');
    const img = container.querySelector('img');
    const heading = screen.getByRole('heading', { name: /biotageom/i });
    const tagline = screen.getByText('Acesso Administrativo');

    expect(root?.className).toContain('flex-col');
    expect(img?.className).toBe('size-[34px] shrink-0');
    expect(heading.tagName).toBe('H1');
    expect(heading.className).toContain('text-2xl');
    expect(heading.parentElement?.className).toContain('items-center');
    expect(tagline.className).toContain('text-sm');
  });

  it('merges a custom className into the root element', () => {
    const { container } = render(<BiotaLogo className="w-full" />);

    const root = container.querySelector('[aria-label="BiotaGeom"]');

    expect(root?.className).toContain('w-full');
  });

  it('renders a stacked span heading at the larger, centered text size', () => {
    render(<BiotaLogo variant="stacked" />);

    const heading = screen.getByText('Geom').parentElement;

    expect(heading?.tagName).toBe('SPAN');
    expect(heading?.className).toContain('text-2xl');
  });

  it('renders a horizontal h1 heading at the smaller text size', () => {
    render(<BiotaLogo nameAs="h1" />);

    const heading = screen.getByRole('heading', { name: /biotageom/i });

    expect(heading.tagName).toBe('H1');
    expect(heading.className).toContain('text-lg');
  });
});
