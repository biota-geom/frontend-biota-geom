import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LegislationRadarDashboardCard } from '../../pages/company/Dashboard/components/LegislationRadarDashboardCard';

describe('LegislationRadarDashboardCard', () => {
  it('reserves the Radar slot as a "coming soon" placeholder', () => {
    render(<LegislationRadarDashboardCard />);

    const card = screen.getByRole('article', { name: 'Radar de Legislação' });
    expect(
      within(card).getByRole('heading', { name: 'Radar de Legislação' })
    ).toBeInTheDocument();
    expect(within(card).getByText('Em breve')).toBeInTheDocument();
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
  });
});
