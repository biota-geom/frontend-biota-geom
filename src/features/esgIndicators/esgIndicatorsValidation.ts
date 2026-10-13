import { z } from 'zod';
import {
  ESG_INDICATOR_KEYS,
  type EsgIndicatorKey,
  type EsgIndicatorsPayload,
  type EsgMonthlyIndicators,
} from './types';

export const ESG_INDICATOR_FIELDS: ReadonlyArray<{
  key: EsgIndicatorKey;
  label: string;
  unit: string;
  placeholder: string;
}> = [
  { key: 'water', label: 'Consumo de Água', unit: 'm³', placeholder: '0,00' },
  { key: 'waste', label: 'Resíduos Gerados', unit: 't', placeholder: '0,00' },
  {
    key: 'employees',
    label: 'Nº de Funcionários',
    unit: 'pessoas',
    placeholder: '0',
  },
  { key: 'energy', label: 'Consumo de Energia', unit: 'kWh', placeholder: '0' },
];

export const INVALID_NUMBER_MESSAGE = 'Informe um número válido.';
export const NEGATIVE_NUMBER_MESSAGE = 'O valor não pode ser negativo.';
export const INTEGER_ONLY_MESSAGE = 'Informe um número inteiro.';

function numericField(options: { integer?: boolean } = {}) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (value === '') return;

      const parsed = Number(value);

      if (!Number.isFinite(parsed)) {
        context.addIssue({ code: 'custom', message: INVALID_NUMBER_MESSAGE });
        return;
      }
      if (parsed < 0) {
        context.addIssue({ code: 'custom', message: NEGATIVE_NUMBER_MESSAGE });
        return;
      }
      if (options.integer && !Number.isInteger(parsed)) {
        context.addIssue({ code: 'custom', message: INTEGER_ONLY_MESSAGE });
      }
    });
}

export const esgIndicatorsSchema = z.object({
  water: numericField(),
  waste: numericField(),
  employees: numericField({ integer: true }),
  energy: numericField(),
});

export type EsgIndicatorsFormValues = z.infer<typeof esgIndicatorsSchema>;

export const EMPTY_ESG_FORM_VALUES: EsgIndicatorsFormValues = {
  water: '',
  waste: '',
  employees: '',
  energy: '',
};

export function toFormValues(
  saved: EsgMonthlyIndicators
): EsgIndicatorsFormValues {
  const values = { ...EMPTY_ESG_FORM_VALUES };

  for (const key of ESG_INDICATOR_KEYS) {
    const value = saved[key];
    values[key] = value === null ? '' : String(value);
  }

  return values;
}

export function toPayload(
  values: EsgIndicatorsFormValues
): EsgIndicatorsPayload {
  const payload: EsgIndicatorsPayload = {};

  for (const key of ESG_INDICATOR_KEYS) {
    if (values[key] !== '') payload[key] = Number(values[key]);
  }

  return payload;
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

export function getPreviousMonth(now = new Date()): string {
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = String(previous.getMonth() + 1).padStart(2, '0');
  return `${previous.getFullYear()}-${month}`;
}

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}
