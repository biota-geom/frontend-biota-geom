import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LegislationRadarDashboardCard } from '../../pages/company/Dashboard/components/LegislationRadarDashboardCard';

describe('LegislationRadarDashboardCard', () => {
  it('points to the licenses, where the Radar now lives', () => {
    render(
      <MemoryRouter>
        <LegislationRadarDashboardCard companyId="company-1" />
      </MemoryRouter>
    );

    const card = screen.getByRole('article', { name: 'Radar de Legislação' });
    expect(
      within(card).getByRole('heading', { name: 'Radar de Legislação' })
    ).toBeInTheDocument();
    expect(within(card).queryByText('Em breve')).not.toBeInTheDocument();
    expect(
      within(card).getByText(/detalhes de cada licença/i)
    ).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: /ver licenças/i })
    ).toHaveAttribute('href', '/companies/company-1/licenses');
  });
});
