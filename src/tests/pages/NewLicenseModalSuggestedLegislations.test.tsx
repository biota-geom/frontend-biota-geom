import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  LicenseExtraction,
  SuggestedLegislation,
} from '../../features/licenses/types';
import { NewLicenseModal } from '../../pages/company/Licenses/components/NewLicenseModal';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  createLicense: vi.fn(),
  extractLicenseData: vi.fn(),
}));
vi.mock('../../services/api/licenseConditionsApi', () => ({
  createLicenseConditions: vi.fn(),
}));
vi.mock('../../services/api/legislationsApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../services/api/legislationsApi')
  >()),
  createLicenseLegislationsBatch: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const legislationsApi = await import('../../services/api/legislationsApi');

const COMPANY_ID = 'customer-1';

const LEI: SuggestedLegislation = {
  legislation: {
    type: 'LEI',
    number: '12.305',
    year: 2010,
    issuingBody: 'Governo Federal',
    summary: 'Institui a Política Nacional de Resíduos Sólidos.',
  },
  citedExcerpt: '…conforme a Lei nº 12.305/2010…',
  source: 'SCAN',
  impact: 'HIGH',
};

const RESOLUCAO: SuggestedLegislation = {
  legislation: {
    type: 'RESOLUCAO',
    number: '237',
    year: 1997,
    issuingBody: 'CONAMA',
    summary: null,
  },
  citedExcerpt: null,
  source: 'SCAN',
  impact: null,
};

const EXTRACTION: LicenseExtraction = {
  extractedData: {
    type: 'LO',
    processNumber: 'LU Nº 00865/2022',
    issuingAgency: 'FEPAM',
    issueDate: '2022-04-28',
    expirationDate: '2027-04-29',
  },
  suggestedConditions: [],
  suggestedLegislations: [LEI, RESOLUCAO],
};

const CREATED_LICENSE = {
  id: 'license-9',
  customerId: COMPANY_ID,
  type: 'LO',
  processNumber: 'LU Nº 00865/2022',
  issuingAgency: 'FEPAM',
  issueDate: '2022-04-28T00:00:00.000Z',
  expirationDate: '2027-04-29T00:00:00.000Z',
  status: 'Regular',
  documentUrl: 'https://bucket.aws.com/licenses/lu.pdf',
  createdAt: '2026-10-25T00:00:00.000Z',
};

async function renderAndScan(extraction: LicenseExtraction = EXTRACTION) {
  const user = userEvent.setup();
  vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(extraction);
  render(
    <NewLicenseModal companyId={COMPANY_ID} onOpenChange={vi.fn()} open />
  );
  await user.upload(
    screen.getByLabelText(/upload de arquivo/i),
    new File(['%PDF-1.4'], 'licenca.pdf', { type: 'application/pdf' })
  );
  await screen.findByText('Revise os dados sugeridos pela IA');

  return user;
}

const found = () =>
  screen.queryByRole('region', { name: 'Legislações encontradas' });
const radar = () => screen.getByRole('region', { name: 'Legislações' });

async function save(user: ReturnType<typeof userEvent.setup>) {
  const saveButton = screen.getByRole('button', { name: /salvar licença/i });
  await waitFor(() => expect(saveButton).toBeEnabled());
  await user.click(saveButton);
}

describe('NewLicenseModal — legislations found by the scan', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(licensesApi.createLicense).mockResolvedValue(CREATED_LICENSE);
    vi.mocked(legislationsApi.createLicenseLegislationsBatch).mockResolvedValue(
      []
    );
  });

  it('lists the laws found with their excerpt and suggested impact, all kept, and saves nothing yet', async () => {
    await renderAndScan();

    const list = within(found()!);
    expect(list.getByText('Lei nº 12.305/2010')).toBeInTheDocument();
    expect(
      list.getByText('…conforme a Lei nº 12.305/2010…')
    ).toBeInTheDocument();
    expect(
      list.getByRole('combobox', { name: 'Impacto de Lei nº 12.305/2010' })
    ).toHaveValue('HIGH');
    expect(
      list.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
    ).toBeChecked();
    expect(
      list.getByRole('checkbox', { name: 'Vincular Resolução nº 237/1997' })
    ).toBeChecked();

    // The kept laws go to the "Legislações" section, flagged as AI-sourced.
    const items = within(radar()).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('IA')).toBeInTheDocument();
    expect(licensesApi.createLicense).not.toHaveBeenCalled();
    expect(
      legislationsApi.createLicenseLegislationsBatch
    ).not.toHaveBeenCalled();
  });

  it('links the kept laws with source SCAN and the suggested impact when the license is saved', async () => {
    const user = await renderAndScan();

    await save(user);

    await waitFor(() =>
      expect(
        legislationsApi.createLicenseLegislationsBatch
      ).toHaveBeenCalledWith('license-9', [
        {
          legislation: LEI.legislation,
          citedExcerpt: '…conforme a Lei nº 12.305/2010…',
          source: 'SCAN',
          impact: 'HIGH',
        },
        {
          legislation: RESOLUCAO.legislation,
          citedExcerpt: null,
          source: 'SCAN',
          impact: null,
        },
      ])
    );
  });

  it('does not link a law that was unchecked', async () => {
    const user = await renderAndScan();

    await user.click(
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
    );

    expect(
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
    ).not.toBeChecked();
    expect(within(radar()).getAllByRole('listitem')).toHaveLength(1);
    expect(
      within(radar()).queryByText('Lei nº 12.305/2010')
    ).not.toBeInTheDocument();

    await save(user);

    await waitFor(() =>
      expect(
        legislationsApi.createLicenseLegislationsBatch
      ).toHaveBeenCalledWith('license-9', [
        expect.objectContaining({
          legislation: RESOLUCAO.legislation,
          source: 'SCAN',
        }),
      ])
    );
  });

  it('keeps an unchecked law listed so it can be checked again', async () => {
    const user = await renderAndScan();
    const checkbox = () =>
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' });

    await user.click(checkbox());
    await user.click(checkbox());

    expect(checkbox()).toBeChecked();
    expect(within(radar()).getAllByRole('listitem')).toHaveLength(2);
  });

  it('unchecks the law in the found list when it is removed from the Legislações section', async () => {
    const user = await renderAndScan();

    await user.click(
      screen.getByRole('button', {
        name: 'Remover legislação Lei nº 12.305/2010',
      })
    );

    expect(
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
    ).not.toBeChecked();
  });

  it('sends the impact the user edited, or none when it was cleared', async () => {
    const user = await renderAndScan();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Impacto de Lei nº 12.305/2010' }),
      'LOW'
    );
    await user.selectOptions(
      screen.getByRole('combobox', {
        name: 'Impacto de Resolução nº 237/1997',
      }),
      'MODERATE'
    );
    await save(user);

    await waitFor(() =>
      expect(
        legislationsApi.createLicenseLegislationsBatch
      ).toHaveBeenCalledWith('license-9', [
        expect.objectContaining({ impact: 'LOW' }),
        expect.objectContaining({ impact: 'MODERATE' }),
      ])
    );
  });

  it('keeps the impact edited on an unchecked law when it is checked again', async () => {
    const user = await renderAndScan();
    const checkbox = () =>
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' });

    await user.click(checkbox());
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Impacto de Lei nº 12.305/2010' }),
      'LOW'
    );
    await user.click(checkbox());
    await save(user);

    await waitFor(() =>
      expect(
        legislationsApi.createLicenseLegislationsBatch
      ).toHaveBeenCalledWith('license-9', [
        expect.objectContaining({
          legislation: RESOLUCAO.legislation,
        }),
        expect.objectContaining({
          legislation: LEI.legislation,
          impact: 'LOW',
        }),
      ])
    );
  });

  it('shows no found list and no legislation when the scan finds no law', async () => {
    const user = await renderAndScan({
      ...EXTRACTION,
      suggestedLegislations: [],
    });

    expect(found()).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma legislação adicionada.')).toBeVisible();

    await save(user);
    await waitFor(() => expect(licensesApi.createLicense).toHaveBeenCalled());
    expect(
      legislationsApi.createLicenseLegislationsBatch
    ).not.toHaveBeenCalled();
  });

  it('replaces the previous suggestions when another PDF is read', async () => {
    const user = await renderAndScan();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue({
      ...EXTRACTION,
      suggestedLegislations: [RESOLUCAO],
    });

    await user.upload(
      screen.getByLabelText(/upload de arquivo/i),
      new File(['%PDF-1.4 outro'], 'outra.pdf', { type: 'application/pdf' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
      ).not.toBeInTheDocument()
    );
    expect(within(radar()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('keeps manual filling available and shows no found list when the reading fails', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockRejectedValue(
      new ApiError(422, 'Não foi possível ler o documento.')
    );
    render(
      <NewLicenseModal companyId={COMPANY_ID} onOpenChange={vi.fn()} open />
    );

    await user.upload(
      screen.getByLabelText(/upload de arquivo/i),
      new File(['%PDF-1.4'], 'licenca.pdf', { type: 'application/pdf' })
    );

    expect(
      await screen.findByText('Não foi possível ler o documento.')
    ).toBeInTheDocument();
    expect(found()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeEnabled();
  });
});
