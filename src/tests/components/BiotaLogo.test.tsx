import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BiotaLogo } from '../../components/ui/BiotaLogo';

describe('BiotaLogo', () => {
  it('renders the complete brand artwork without a default tagline', () => {
    render(<BiotaLogo />);

    expect(screen.getByRole('img', { name: 'BiotaGeom' })).toHaveAttribute(
      'src',
      expect.stringContaining('biota-geom-logo.svg')
    );
    expect(screen.queryByText('PLATAFORMA ESG')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('keeps an accessible h1 and custom tagline on access screens', () => {
    render(
      <BiotaLogo
        nameAs="h1"
        tagline="Acesso Administrativo"
        variant="stacked"
      />
    );

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'BiotaGeom',
    });

    expect(heading).toContainElement(screen.getByRole('img'));
    expect(screen.getByText('Acesso Administrativo')).toBeInTheDocument();
  });

  it('merges a custom className into the root element', () => {
    render(<BiotaLogo className="w-full" />);

    expect(screen.getByLabelText('BiotaGeom')).toHaveClass('w-full');
  });

  it('supports a stacked logo without a heading', () => {
    render(<BiotaLogo variant="stacked" />);

    expect(screen.getByRole('img', { name: 'BiotaGeom' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('supports a horizontal logo as a heading', () => {
    render(<BiotaLogo nameAs="h1" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'BiotaGeom' })
    ).toBeInTheDocument();
  });
});
