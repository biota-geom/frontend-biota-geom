import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnvironmentalObligationsDashboardCard } from '../../pages/company/Dashboard/components/EnvironmentalObligationsDashboardCard';

describe('EnvironmentalObligationsDashboardCard', () => {
  it('renders the accessible card and its heading', () => {
    render(<EnvironmentalObligationsDashboardCard />);

    const card = screen.getByRole('article', {
      name: 'Obrigações ambientais',
    });

    expect(
      within(card).getByRole('heading', {
        name: 'Obrigações Ambientais',
      })
    ).toBeInTheDocument();
    expect(card).toHaveAttribute('data-variant', 'dashboard');
  });

  it('renders an empty area reserved for the environmental obligations summary', () => {
    const { container } = render(<EnvironmentalObligationsDashboardCard />);

    const summaryArea = container.querySelector(
      '[aria-label="Área reservada para o resumo das obrigações ambientais"]'
    );

    expect(summaryArea).toBeInTheDocument();
    expect(summaryArea).toBeEmptyDOMElement();
  });
});
