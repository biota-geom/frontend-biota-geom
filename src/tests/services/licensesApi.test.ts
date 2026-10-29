import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  createLicense,
  extractLicenseData,
  getLicenseDetails,
  getLicenseDocumentUrl,
  getLicenseDashboard,
  getLicenseHistory,
  listLicenses,
  renewLicense,
} = await import('../../services/api/licensesApi');

describe('licensesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extractLicenseData() posts the PDF in the "document" field and maps the suggestions', async () => {
    vi.mocked(request).mockResolvedValue({
      extracted_data: {
        type: 'LO',
        process_number: 'LO nº 118/2020',
        issuing_agency: 'FEPAM',
        issue_date: '2020-01-10',
        expiration_date: '2025-01-10',
      },
      suggested_conditions: [
        {
          environmental_descriptor: 'Resíduos Sólidos',
          description: 'Apresentar relatório semestral',
          condition_type: 'PERIODIC',
          periodicity: 'SEMIANNUAL',
          due_date: null,
        },
      ],
    });
    const file = new File(['%PDF-1.4'], 'licenca.pdf', {
      type: 'application/pdf',
    });

    const result = await extractLicenseData(file);

    const [path, options] = vi.mocked(request).mock.calls[0] as [
      string,
      { method: string; body: FormData },
    ];
    expect(path).toBe('/api/licenses/extract');
    expect(options.method).toBe('POST');
    expect(options.body.get('document')).toBe(file);
    expect(result).toEqual({
      extractedData: {
        type: 'LO',
        processNumber: 'LO nº 118/2020',
        issuingAgency: 'FEPAM',
        issueDate: '2020-01-10',
        expirationDate: '2025-01-10',
      },
      suggestedConditions: [
        {
          environmentalDescriptor: 'Resíduos Sólidos',
          description: 'Apresentar relatório semestral',
          conditionType: 'PERIODIC',
          periodicity: 'SEMIANNUAL',
          dueDate: null,
        },
      ],
    });
  });

  it('extractLicenseData() keeps any license type as printed, since the field is free text', async () => {
    vi.mocked(request).mockResolvedValue({
      extracted_data: {
        type: 'LU',
        process_number: null,
        issuing_agency: null,
        issue_date: null,
        expiration_date: null,
      },
      suggested_conditions: [],
    });

    const result = await extractLicenseData(
      new File(['%PDF'], 'l.pdf', { type: 'application/pdf' })
    );

    expect(result.extractedData.type).toBe('LU');
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
      issuing_agency: 'FEPAM',
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
      issuingAgency: 'FEPAM',
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
    expect(formData.get('issuing_agency')).toBe('FEPAM');
    expect(formData.get('issue_date')).toBe('2020-01-10');
    expect(formData.get('expiration_date')).toBe('2025-01-10');
    expect(formData.get('document_file')).toBe(file);

    expect(license).toEqual({
      id: 'license-1',
      customerId: 'customer-1',
      type: 'LO',
      processNumber: 'LO nº 118/2020',
      issuingAgency: 'FEPAM',
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
      conditions: [
        {
          conditionId: 'condition-1',
          fulfilled: true,
          copyToNew: true,
          newDueDate: '2027-10-01',
        },
        { conditionId: 'condition-2', fulfilled: false, copyToNew: false },
      ],
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
    expect(JSON.parse(formData.get('conditions') as string)).toEqual([
      {
        condition_id: 'condition-1',
        fulfilled: true,
        copy_to_new: true,
        new_due_date: '2027-10-01',
      },
      { condition_id: 'condition-2', fulfilled: false, copy_to_new: false },
    ]);
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

  it('getLicenseHistory() requests the version chain and maps it to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'license-2',
        customer_id: 'customer-1',
        process_number: 'LO nº 119/2026',
        issue_date: '2026-01-10T00:00:00.000Z',
        expiration_date: '2030-01-10T00:00:00.000Z',
        status: 'Regular',
        is_current: true,
      },
      {
        id: 'license-1',
        customer_id: 'customer-1',
        process_number: 'LO nº 118/2020',
        issue_date: '2020-01-10T00:00:00.000Z',
        expiration_date: '2025-01-10T00:00:00.000Z',
        status: 'Renovada/Arquivada',
        is_current: false,
      },
    ]);

    const versions = await getLicenseHistory('license-2');

    expect(request).toHaveBeenCalledWith('/api/licenses/license-2/history');
    expect(versions).toEqual([
      {
        id: 'license-2',
        processNumber: 'LO nº 119/2026',
        issueDate: '2026-01-10T00:00:00.000Z',
        expirationDate: '2030-01-10T00:00:00.000Z',
        status: 'Regular',
        isCurrent: true,
      },
      {
        id: 'license-1',
        processNumber: 'LO nº 118/2020',
        issueDate: '2020-01-10T00:00:00.000Z',
        expirationDate: '2025-01-10T00:00:00.000Z',
        status: 'Renovada/Arquivada',
        isCurrent: false,
      },
    ]);
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
