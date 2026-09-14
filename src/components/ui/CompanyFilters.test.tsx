import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompanyFilters } from './CompanyFilters';
import userEvent from '@testing-library/user-event';

describe('CompanyFilters', () => {
  it('deve chamar onFilterChange 500ms depois de parar de digitar', async () => {
    const onFilterChange = vi.fn();
    render(<CompanyFilters segments={[]} onFilterChange={onFilterChange} />);

    const input = screen.getByPlaceholderText(
      'Buscar por nome da filial, estado ou segmento...'
    );
    const user = userEvent.setup();

    await user.type(input, 'Petrobras');

    expect(onFilterChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledTimes(1);
    });

    expect(onFilterChange).toHaveBeenCalledWith({
      search: 'Petrobras',
      segment_id: '',
      status: '',
    });
  });

  it('deve disparar mudança imediatamente sem debounce ao trocar o dropdown', async () => {
    const segments = [{ id: '1', name: 'Tecnologia' }];
    const onFilterChange = vi.fn();
    render(
      <CompanyFilters segments={segments} onFilterChange={onFilterChange} />
    );

    const segmentSelect = screen.getByDisplayValue('Segmento: Todos');
    const user = userEvent.setup();

    await user.selectOptions(segmentSelect, 'Segmento: Tecnologia');

    expect(onFilterChange).toHaveBeenCalledWith({
      search: '',
      segment_id: '1',
      status: '',
    });
  });
});
