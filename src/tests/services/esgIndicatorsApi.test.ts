import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { getEsgIndicators, saveEsgIndicators, createCustomerIndicator } =
  await import('../../services/api/esgIndicatorsApi');

const COMPANY_ID = 'customer-1';
const MONTH = '2026-09';

const WIRE_RESPONSE = [
  {
    indicator_id: 'uuid-ind-1',
    name: 'Consumo de Água',
    unit: 'm³',
    category: 'Ambiental' as const,
    value: 1250.5,
  },
  {
    indicator_id: 'uuid-ind-2',
    name: 'Resíduos Totais',
    unit: 't',
    category: 'Ambiental' as const,
    value: null,
  },
  {
    indicator_id: 'uuid-ind-3',
    name: 'Número de Colaboradores',
    unit: 'un',
    category: 'Social' as const,
    value: 85,
  },
];

describe('esgIndicatorsApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getEsgIndicators()', () => {
    it('fetches the month of the company and maps the array', async () => {
      vi.mocked(request).mockResolvedValue(WIRE_RESPONSE);

      const indicators = await getEsgIndicators(COMPANY_ID, MONTH);

      expect(request).toHaveBeenCalledWith(
        `/api/customers/${COMPANY_ID}/esg-indicators/${MONTH}`
      );
      expect(indicators).toEqual([
        {
          indicator_id: 'uuid-ind-1',
          name: 'Consumo de Água',
          unit: 'm³',
          category: 'Ambiental',
          value: 1250.5,
        },
        {
          indicator_id: 'uuid-ind-2',
          name: 'Resíduos Totais',
          unit: 't',
          category: 'Ambiental',
          value: null,
        },
        {
          indicator_id: 'uuid-ind-3',
          name: 'Número de Colaboradores',
          unit: 'un',
          category: 'Social',
          value: 85,
        },
      ]);
    });

    it('maps null values to null', async () => {
      vi.mocked(request).mockResolvedValue([
        {
          indicator_id: 'uuid-ind-1',
          name: 'Água',
          unit: 'm³',
          category: 'Ambiental',
          value: null,
        },
      ]);

      const indicators = await getEsgIndicators(COMPANY_ID, MONTH);
      expect(indicators[0].value).toBeNull();
    });

    it('treats a non-array response body as an empty month', async () => {
      vi.mocked(request).mockResolvedValue(undefined);

      const indicators = await getEsgIndicators(COMPANY_ID, '2026-08');
      expect(indicators).toEqual([]);
    });
  });

  describe('saveEsgIndicators()', () => {
    it('PUTs the records array and returns the updated list', async () => {
      vi.mocked(request).mockResolvedValue(WIRE_RESPONSE);

      const payload = {
        records: [
          { indicator_id: 'uuid-ind-1', value: 1300 },
          { indicator_id: 'uuid-ind-2', value: null },
        ],
      };

      const result = await saveEsgIndicators(COMPANY_ID, MONTH, payload);

      expect(request).toHaveBeenCalledWith(
        `/api/customers/${COMPANY_ID}/esg-indicators/${MONTH}`,
        { method: 'PUT', body: payload }
      );
      expect(result).toHaveLength(3);
      expect(result[0].indicator_id).toBe('uuid-ind-1');
    });

    it('returns empty array when response is not an array', async () => {
      vi.mocked(request).mockResolvedValue(undefined);

      const result = await saveEsgIndicators(COMPANY_ID, MONTH, {
        records: [{ indicator_id: 'uuid-ind-1', value: 100 }],
      });
      expect(result).toEqual([]);
    });
  });

  describe('createCustomerIndicator()', () => {
    it('POSTs to /indicators and returns the new indicator with null value', async () => {
      const wireItem = {
        indicator_id: 'uuid-new',
        name: 'Consumo de Combustível',
        unit: 'L',
        category: 'Ambiental' as const,
        value: null,
      };
      vi.mocked(request).mockResolvedValue(wireItem);

      const result = await createCustomerIndicator(COMPANY_ID, {
        name: 'Consumo de Combustível',
        unit: 'L',
        category: 'Ambiental',
      });

      expect(request).toHaveBeenCalledWith(
        `/api/customers/${COMPANY_ID}/indicators`,
        {
          method: 'POST',
          body: {
            name: 'Consumo de Combustível',
            unit: 'L',
            category: 'Ambiental',
          },
        }
      );
      expect(result).toEqual({
        indicator_id: 'uuid-new',
        name: 'Consumo de Combustível',
        unit: 'L',
        category: 'Ambiental',
        value: null,
      });
    });
  });
});
