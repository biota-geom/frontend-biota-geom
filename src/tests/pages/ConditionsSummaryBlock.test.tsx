import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseCondition } from '../../features/licenseConditions/types';
import { useConditions } from '../../features/licenseConditions/useConditions';
import { useConditionsCompliance } from '../../features/licenseConditions/useConditionsCompliance';
import { useLicensesPanel } from '../../features/licenses/useLicensesPanel';
import { ConditionsSummaryBlock } from '../../pages/company/Dashboard/components/ConditionsSummaryBlock';

vi.mock('../../features/licenseConditions/useConditions', () => ({
  useConditions: vi.fn(),
}));

vi.mock('../../features/licenseConditions/useConditionsCompliance', () => ({
  useConditionsCompliance: vi.fn(),
}));

vi.mock('../../features/licenses/useLicensesPanel', () => ({
  useLicensesPanel: vi.fn(),
}));

const makeCondition = (
  id: string,
  riskLevel: LicenseCondition['riskLevel'],
  licenseId = 'active-license'
): LicenseCondition => ({
  id,
  licenseId,
  name: `Condicionante ${id}`,
  description: null,
  environmentalDescriptor: `Descritor ${id}`,
  responsibleAgency: null,
  dueDate: '2026-10-25T00:00:00.000Z',
  status:
    riskLevel === 'RISK'
      ? 'Risco'
      : riskLevel === 'ATTENTION'
        ? 'Atenção'
        : 'Regular',
  hasDelivery: false,
  isViolated: false,
  riskLevel,
});

function renderBlock() {
  return render(
    <MemoryRouter>
      <ConditionsSummaryBlock companyId="company-1" />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useConditions).mockReturnValue({
    conditions: [],
    error: null,
    refetch: vi.fn(),
    status: 'success',
    total: 0,
  });
  vi.mocked(useConditionsCompliance).mockReturnValue({
    compliance: {
      totalActive: 4,
      inCompliance: 2,
      compliancePercentage: 50,
    },
    error: null,
    refetch: vi.fn(),
  });
  vi.mocked(useLicensesPanel).mockReturnValue({
    summary: { total: 1, regular: 1, attention: 0, expired: 0 },
    licenses: [
      {
        id: 'active-license',
        type: 'Licença de Operação (LO)',
        processNumber: 'LO 1',
        issuingAgency: null,
        issueDate: '2026-01-01',
        expirationDate: '2027-01-01',
        status: 'Regular',
        documentUrl: null,
      },
      {
        id: 'archived-license',
        type: 'Licença de Operação (LO)',
        processNumber: 'LO 2',
        issuingAgency: null,
        issueDate: '2026-01-01',
        expirationDate: '2027-01-01',
        status: 'Renovada/Arquivada',
        documentUrl: null,
      },
    ],
    loadLicenses: vi.fn(),
    requestedCustomerId: 'company-1',
    status: 'success',
    error: null,
  });
});

describe('ConditionsSummaryBlock', () => {
  it('reuses monitor conformity and prioritizes risk within the three-item limit', () => {
    vi.mocked(useConditions).mockReturnValue({
      conditions: [
        makeCondition('attention', 'ATTENTION'),
        makeCondition('regular', 'REGULAR'),
        makeCondition('risk-1', 'RISK'),
        makeCondition('risk-2', 'RISK'),
        makeCondition('archived', 'RISK', 'archived-license'),
      ],
      error: null,
      refetch: vi.fn(),
      status: 'success',
      total: 5,
    });

    renderBlock();

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50'
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver monitor/i })).toHaveAttribute(
      'href',
      '/companies/company-1/conditions'
    );

    const list = within(
      screen.getByRole('list', { name: 'Condicionantes prioritárias' })
    );
    const items = list.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Condicionante risk-1');
    expect(items[1]).toHaveTextContent('Condicionante risk-2');
    expect(items[2]).toHaveTextContent('Condicionante attention');
    expect(
      screen.queryByText('Condicionante archived')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Condicionante regular')).not.toBeInTheDocument();
  });

  it('shows an empty state when the company has no active conditions', () => {
    renderBlock();

    expect(
      screen.getByText('Nenhuma condicionante cadastrada para esta empresa.')
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50'
    );
  });
});
