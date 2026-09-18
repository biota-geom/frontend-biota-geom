import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { createLicense } = await import('../../services/api/licensesApi');

describe('licensesApi', () => {
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
    expect(path).toBe('/customers/customer-1/licenses');
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
});
