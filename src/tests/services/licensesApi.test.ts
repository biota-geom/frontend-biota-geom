import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  createLicense,
  getLicenseDetails,
  getLicenseDocumentUrl,
  listLicenses,
  renewLicense,
} = await import('../../services/api/licensesApi');

describe('licensesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLicenseDocumentUrl() requests the signed URL and maps the response', async () => {
    vi.mocked(request).mockResolvedValue({
      document_url:
        'https://bucket.s3.amazonaws.com/licenses/c-1/doc.pdf?X-Amz-Signature=abc',
      expires_in: 900,
    });

    const documentUrl = await getLicenseDocumentUrl('license-1');

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/document/url'
    );
    expect(documentUrl).toEqual({
      url: 'https://bucket.s3.amazonaws.com/licenses/c-1/doc.pdf?X-Amz-Signature=abc',
      expiresIn: 900,
    });
  });

  it('getLicenseDetails() requests the customer license and maps its conditions', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'license-1',
      process_number: 'LO nº 118/2020',
      type: 'Licença de Operação (LO)',
      issuing_agency: 'FEPAM',
      issue_date: '2020-01-10T00:00:00.000Z',
      expiration_date: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
      conditions: [
        {
          id: 'condition-1',
          item_number: '1.1',
          is_environmental_descriptor: false,
          environmental_descriptor: 'Água',
          name: 'Monitoramento',
          description: 'Laudo trimestral',
          condition_type: 'PERIODIC',
          periodicity: 'QUARTERLY',
          deadline: '2026-01-10T00:00:00.000Z',
          status: 'IN_PROGRESS',
          completion_date: null,
          responsible_name: 'Lucas',
          has_delivery: true,
          is_violated: false,
        },
      ],
    });

    const details = await getLicenseDetails('customer-1', 'license-1');

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/licenses/license-1'
    );
    expect(details).toEqual({
      id: 'license-1',
      processNumber: 'LO nº 118/2020',
      type: 'Licença de Operação (LO)',
      issuingAgency: 'FEPAM',
      issueDate: '2020-01-10T00:00:00.000Z',
      expirationDate: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
      conditions: [
        {
          id: 'condition-1',
          itemNumber: '1.1',
          isEnvironmentalDescriptor: false,
          environmentalDescriptor: 'Água',
          name: 'Monitoramento',
          description: 'Laudo trimestral',
          conditionType: 'PERIODIC',
          periodicity: 'QUARTERLY',
          deadline: '2026-01-10T00:00:00.000Z',
          status: 'IN_PROGRESS',
          completionDate: null,
          responsibleName: 'Lucas',
          hasDelivery: true,
          isViolated: false,
        },
      ],
    });
  });

  it('createLicense() posts a FormData body and maps the response to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'license-1',
      customer_id: 'customer-1',
      type: 'LO',
      process_number: 'LO nº 118/2020',
      issuing_agency_id: 'agency-1',
      issuing_agency_name: 'FEPAM',
      issue_date: '2020-01-10T00:00:00.000Z',
      expiration_date: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
      document_url: 'https://bucket.aws.com/licenses/lo-118-2020.pdf',
      created_at: '2020-01-10T00:00:00.000Z',
    });
    const file = new File(['%PDF-1.4'], 'licenca.pdf', {
      type: 'application/pdf',
    });

    const license = await createLicense('customer-1', {
      type: 'LO',
      processNumber: 'LO nº 118/2020',
      issuingAgencyId: 'agency-1',
      issueDate: '2020-01-10',
      expirationDate: '2025-01-10',
      documentFile: file,
    });

    expect(request).toHaveBeenCalledTimes(1);
    const [path, options] = vi.mocked(request).mock.calls[0]!;
    expect(path).toBe('/api/customers/customer-1/licenses');
    expect(options?.method).toBe('POST');

    const formData = options?.body as FormData;
    expect(formData.get('type')).toBe('LO');
    expect(formData.get('process_number')).toBe('LO nº 118/2020');
    expect(formData.get('issuing_agency_id')).toBe('agency-1');
    expect(formData.get('issue_date')).toBe('2020-01-10');
    expect(formData.get('expiration_date')).toBe('2025-01-10');
    expect(formData.get('document_file')).toBe(file);

    expect(license).toEqual({
      id: 'license-1',
      customerId: 'customer-1',
      type: 'LO',
      processNumber: 'LO nº 118/2020',
      issuingAgencyId: 'agency-1',
      issuingAgencyName: 'FEPAM',
      issueDate: '2020-01-10T00:00:00.000Z',
      expirationDate: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
      documentUrl: 'https://bucket.aws.com/licenses/lo-118-2020.pdf',
      createdAt: '2020-01-10T00:00:00.000Z',
    });
  });

  it('renewLicense() posts the new license data as multipart and maps the response', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'new-license',
      previous_license_id: 'old-license',
      status: 'Regular',
    });
    const file = new File(['%PDF-1.4'], 'renovada.pdf', {
      type: 'application/pdf',
    });

    const renewed = await renewLicense('old-license', {
      processNumber: 'LO nº 119/2026',
      issueDate: '2026-01-10',
      expirationDate: '2030-01-10',
      documentFile: file,
    });

    expect(request).toHaveBeenCalledTimes(1);
    const [path, options] = vi.mocked(request).mock.calls[0]!;
    expect(path).toBe('/api/licenses/old-license/renew');
    expect(options?.method).toBe('POST');

    const formData = options?.body as FormData;
    expect(formData.get('process_number')).toBe('LO nº 119/2026');
    expect(formData.get('issue_date')).toBe('2026-01-10');
    expect(formData.get('expiration_date')).toBe('2030-01-10');
    expect(formData.get('document_file')).toBe(file);
    expect(renewed).toEqual({
      id: 'new-license',
      previousLicenseId: 'old-license',
      status: 'Regular',
    });
  });

  it('listLicenses() fetches the panel and maps summary/licenses to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue({
      summary: { total: 2, regular: 1, attention: 0, expired: 1 },
      licenses: [
        {
          id: 'license-1',
          type: 'Licença Prévia (LP)',
          process_number: 'LP nº 482/2024',
          issuing_agency: 'FEPAM',
          issue_date: '2024-03-12T00:00:00.000Z',
          expiration_date: '2026-03-12T00:00:00.000Z',
          status: 'Regular',
          document_url: 'https://bucket.aws.com/licenses/lp-482-2024.pdf',
        },
        {
          id: 'license-2',
          type: 'Licença de Operação (LO)',
          process_number: 'LO nº 118/2020',
          issuing_agency: null,
          issue_date: '2020-01-10T00:00:00.000Z',
          expiration_date: '2025-01-10T00:00:00.000Z',
          status: 'Vencida',
          document_url: null,
        },
      ],
    });

    const panel = await listLicenses('customer-1');

    expect(request).toHaveBeenCalledWith('/api/customers/customer-1/licenses');
    expect(panel).toEqual({
      summary: { total: 2, regular: 1, attention: 0, expired: 1 },
      licenses: [
        {
          id: 'license-1',
          type: 'Licença Prévia (LP)',
          processNumber: 'LP nº 482/2024',
          issuingAgency: 'FEPAM',
          issueDate: '2024-03-12T00:00:00.000Z',
          expirationDate: '2026-03-12T00:00:00.000Z',
          status: 'Regular',
          documentUrl: 'https://bucket.aws.com/licenses/lp-482-2024.pdf',
        },
        {
          id: 'license-2',
          type: 'Licença de Operação (LO)',
          processNumber: 'LO nº 118/2020',
          issuingAgency: null,
          issueDate: '2020-01-10T00:00:00.000Z',
          expirationDate: '2025-01-10T00:00:00.000Z',
          status: 'Vencida',
          documentUrl: null,
        },
      ],
    });
  });

  it('getLicenseDashboard() maps dashboard metrics and critical licenses', async () => {
    vi.mocked(request).mockResolvedValue({
      header: { active_licenses: 4, pending_items: 3 },
      counts: { regular: 2, attention: 1, expired: 1 },
      critical: [
        {
          id: 'license-1',
          type: 'LO',
          process_number: 'LO 118/2020',
          expiration_date: '2026-09-01',
          status: 'Vencida',
        },
      ],
    });

    const dashboard = await getLicenseDashboard('customer-1');

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/dashboard/licenses'
    );
    expect(dashboard).toEqual({
      header: { activeLicenses: 4, pendingItems: 3 },
      counts: { regular: 2, attention: 1, expired: 1 },
      critical: [
        {
          id: 'license-1',
          type: 'LO',
          processNumber: 'LO 118/2020',
          expirationDate: '2026-09-01',
          status: 'Vencida',
        },
      ],
    });
  });
});
