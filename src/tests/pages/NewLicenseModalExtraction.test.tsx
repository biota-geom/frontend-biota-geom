import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseExtraction } from '../../features/licenses/types';
import { NewLicenseModal } from '../../pages/company/Licenses/components/NewLicenseModal';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/issuingAgenciesApi', () => ({
  listIssuingAgencies: vi.fn(),
}));
vi.mock('../../services/api/licensesApi', () => ({
  createLicense: vi.fn(),
  extractLicenseData: vi.fn(),
}));
vi.mock('../../services/api/licenseConditionsApi', () => ({
  createLicenseConditions: vi.fn(),
}));

const issuingAgenciesApi =
  await import('../../services/api/issuingAgenciesApi');
const licensesApi = await import('../../services/api/licensesApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');

const COMPANY_ID = 'customer-1';

const EXTRACTION: LicenseExtraction = {
  extractedData: {
    type: 'LO',
    processNumber: 'LU Nº 00865/2022',
    issuingAgency: 'FEPAM',
    issueDate: '2022-04-28',
    expirationDate: '2027-04-29',
  },
  suggestedConditions: [
    {
      environmentalDescriptor: 'Resíduos Perigosos',
      description: 'O transporte deverá ser acompanhado do MTR.',
      conditionType: 'INFORMATIVE',
      periodicity: null,
      dueDate: null,
    },
    {
      environmentalDescriptor: 'Empreendimento',
      description: 'Apresentar relatório anual de frota.',
      conditionType: 'PERIODIC',
      periodicity: 'ANNUAL',
      dueDate: '2026-12-31',
    },
  ],
};

const CREATED_LICENSE = {
  id: 'license-9',
  customerId: COMPANY_ID,
  type: 'LO' as const,
  processNumber: 'LU Nº 00865/2022',
  issuingAgencyId: 'agency-fepam',
  issuingAgencyName: 'FEPAM',
  issueDate: '2022-04-28T00:00:00.000Z',
  expirationDate: '2027-04-29T00:00:00.000Z',
  status: 'Regular',
  documentUrl: 'https://bucket.aws.com/licenses/lu.pdf',
  createdAt: '2026-10-25T00:00:00.000Z',
};

function pdfFile() {
  return new File(['%PDF-1.4'], 'licenca.pdf', { type: 'application/pdf' });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderModal() {
  const onOpenChange = vi.fn();
  render(
    <NewLicenseModal companyId={COMPANY_ID} onOpenChange={onOpenChange} open />
  );
  return { onOpenChange };
}

async function uploadPdf(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText(/upload de arquivo/i), pdfFile());
}

describe('NewLicenseModal — AI pre-fill', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(issuingAgenciesApi.listIssuingAgencies).mockResolvedValue([
      {
        id: 'agency-fepam',
        name: 'Fundação Estadual de Proteção Ambiental',
        acronym: 'FEPAM',
      },
      { id: 'agency-ibama', name: 'IBAMA', acronym: 'IBAMA' },
    ]);
  });

  it('reads the PDF on upload, shows "Lendo documento…" and pre-fills the recognized fields', async () => {
    const user = userEvent.setup();
    const reading = deferred<LicenseExtraction>();
    vi.mocked(licensesApi.extractLicenseData).mockReturnValue(reading.promise);
    renderModal();

    await uploadPdf(user);

    expect(await screen.findByText('Lendo documento…')).toBeInTheDocument();
    expect(licensesApi.extractLicenseData).toHaveBeenCalledWith(
      expect.any(File)
    );

    reading.resolve(EXTRACTION);

    expect(
      await screen.findByText('Revise os dados sugeridos pela IA')
    ).toBeInTheDocument();
    expect(screen.queryByText('Lendo documento…')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nº do processo/i)).toHaveValue(
      'LU Nº 00865/2022'
    );
    expect(screen.getByLabelText(/data de emissão/i)).toHaveValue('2022-04-28');
    expect(screen.getByLabelText(/data de validade/i)).toHaveValue(
      '2027-04-29'
    );
    expect(
      screen.getByRole('combobox', { name: /tipo de licença/i })
    ).toHaveTextContent('LO - Licença de Operação');
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /órgão emissor/i })
      ).toHaveTextContent('FEPAM')
    );
    // Nothing is saved by the extraction itself.
    expect(licensesApi.createLicense).not.toHaveBeenCalled();
    expect(licenseConditionsApi.createLicenseConditions).not.toHaveBeenCalled();
  });

  it('does not overwrite a field the user already filled', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    renderModal();

    await user.type(screen.getByLabelText(/nº do processo/i), 'Meu número');
    await uploadPdf(user);

    expect(
      await screen.findByText('Revise os dados sugeridos pela IA')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nº do processo/i)).toHaveValue('Meu número');
    expect(screen.getByLabelText(/data de emissão/i)).toHaveValue('2022-04-28');
  });

  it('leaves the issuing agency for manual selection when it has no unique match', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue({
      ...EXTRACTION,
      extractedData: { ...EXTRACTION.extractedData, issuingAgency: 'CETESB' },
    });
    renderModal();

    await uploadPdf(user);

    expect(
      await screen.findByText(/órgão identificado no documento: “CETESB”/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /órgão emissor/i })
    ).toHaveTextContent('Selecione o órgão');
  });

  it('lists the suggested conditions unselected and saves only the selected ones through the existing routes', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    vi.mocked(licensesApi.createLicense).mockResolvedValue(CREATED_LICENSE);
    vi.mocked(licenseConditionsApi.createLicenseConditions).mockResolvedValue(
      undefined
    );
    const { onOpenChange } = renderModal();

    await uploadPdf(user);

    const first = await screen.findByRole('checkbox', {
      name: 'Incluir condicionante sugerida 1',
    });
    const second = screen.getByRole('checkbox', {
      name: 'Incluir condicionante sugerida 2',
    });
    expect(first).not.toBeChecked();
    expect(second).not.toBeChecked();
    expect(
      screen.getByText('Apresentar relatório anual de frota.')
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /órgão emissor/i })
      ).toHaveTextContent('FEPAM')
    );

    // Selecting a suggestion makes its missing fields required.
    await user.click(second);
    const saveButton = screen.getByRole('button', { name: /salvar licença/i });
    await waitFor(() => expect(saveButton).toBeDisabled());

    expect(screen.getByLabelText('Descrição')).toHaveValue(
      'Apresentar relatório anual de frota.'
    );
    await user.clear(screen.getByLabelText('Descrição'));
    await user.type(
      screen.getByLabelText('Descrição'),
      'Apresentar relatório anual da frota licenciada.'
    );
    await user.type(screen.getByLabelText('Responsável'), 'Ana Souza');
    await waitFor(() => expect(saveButton).toBeEnabled());

    await user.click(saveButton);

    await waitFor(() =>
      expect(licenseConditionsApi.createLicenseConditions).toHaveBeenCalledWith(
        COMPANY_ID,
        'license-9',
        [
          {
            environmentalDescriptor: 'Empreendimento',
            description: 'Apresentar relatório anual da frota licenciada.',
            conditionType: 'PERIODIC',
            periodicity: 'ANNUAL',
            deadline: '2026-12-31T00:00:00.000Z',
            responsibleName: 'Ana Souza',
            hasDelivery: true,
          },
        ]
      )
    );
    expect(licensesApi.createLicense).toHaveBeenCalledWith(COMPANY_ID, {
      type: 'LO',
      processNumber: 'LU Nº 00865/2022',
      issuingAgencyId: 'agency-fepam',
      issueDate: '2022-04-28',
      expirationDate: '2027-04-29',
      documentFile: expect.any(File),
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  }, 20_000);

  it('fills only the empty deadline/responsible of the selected suggestions', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    renderModal();

    await uploadPdf(user);
    await user.click(
      await screen.findByRole('button', { name: /selecionar todas/i })
    );

    fireEvent.change(screen.getByLabelText('Prazo padrão'), {
      target: { value: '2027-01-31' },
    });
    await user.type(screen.getByLabelText('Responsável padrão'), 'Equipe SGA');
    await user.click(
      screen.getByRole('button', { name: /preencher vazios das selecionadas/i })
    );

    const deadlines = screen.getAllByLabelText('Prazo');
    expect(deadlines[0]).toHaveValue('2027-01-31');
    // The deadline stated in the document is kept.
    expect(deadlines[1]).toHaveValue('2026-12-31');
    for (const responsible of screen.getAllByLabelText('Responsável')) {
      expect(responsible).toHaveValue('Equipe SGA');
    }
  }, 20_000);

  it('shows the error and keeps manual filling available when the document cannot be read (422)', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockRejectedValue(
      new ApiError(
        422,
        'Não foi possível ler os dados deste documento. Preencha os campos manualmente.'
      )
    );
    vi.mocked(licensesApi.createLicense).mockResolvedValue(CREATED_LICENSE);
    renderModal();

    await uploadPdf(user);

    expect(
      await screen.findByText(
        'Não foi possível ler os dados deste documento. Preencha os campos manualmente.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Lendo documento…')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Revise os dados sugeridos pela IA')
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('combobox', { name: /tipo de licença/i })
    );
    await user.click(
      await screen.findByRole('option', { name: /licença de operação/i })
    );
    await user.type(screen.getByLabelText(/nº do processo/i), 'LO nº 1/2024');
    await user.click(screen.getByRole('combobox', { name: /órgão emissor/i }));
    await user.click(await screen.findByRole('option', { name: 'FEPAM' }));
    await user.type(screen.getByLabelText(/data de emissão/i), '2024-01-10');
    await user.type(screen.getByLabelText(/data de validade/i), '2028-01-10');
    await user.click(screen.getByRole('button', { name: /salvar licença/i }));

    await waitFor(() =>
      expect(licensesApi.createLicense).toHaveBeenCalledTimes(1)
    );
  }, 20_000);

  it('falls back to a generic message for an unexpected failure', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockRejectedValue(
      new Error('boom')
    );
    renderModal();

    await uploadPdf(user);

    expect(
      await screen.findByText(
        'Não foi possível ler o documento automaticamente. Preencha os campos manualmente.'
      )
    ).toBeInTheDocument();
  });

  it('does not send a non-PDF file for reading', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/upload de arquivo/i), {
      target: {
        files: [new File(['x'], 'foto.jpg', { type: 'image/jpeg' })],
      },
    });

    expect(
      await screen.findByText('O arquivo deve estar no formato PDF.')
    ).toBeInTheDocument();
    expect(licensesApi.extractLicenseData).not.toHaveBeenCalled();
  });
});
