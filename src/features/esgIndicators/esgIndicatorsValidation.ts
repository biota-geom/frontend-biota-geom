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

/*
 * Every field is a string in the form (an empty input is ''), because a
 * partially filled month is valid: blank means "not informed", not zero.
 */
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

/*
 * Blank means "not informed". For an indicator that already has a saved value,
 * though, a blank field is the user clearing it, so it goes out as null (the
 * API deletes the record). Blank with nothing saved is simply left out.
 */
export function toPayload(
  values: EsgIndicatorsFormValues,
  saved: EsgMonthlyIndicators | null = null
): EsgIndicatorsPayload {
  const payload: EsgIndicatorsPayload = {};

  for (const key of ESG_INDICATOR_KEYS) {
    if (values[key] !== '') {
      payload[key] = Number(values[key]);
    } else if (saved?.[key] != null) {
      payload[key] = null;
    }
  }

  return payload;
}

/** What the month looks like once `payload` has been saved on top of `saved`. */
export function applyPayload(
  saved: EsgMonthlyIndicators | null,
  payload: EsgIndicatorsPayload
): EsgMonthlyIndicators {
  const result: EsgMonthlyIndicators = {
    water: null,
    waste: null,
    employees: null,
    energy: null,
    ...saved,
  };

  for (const key of ESG_INDICATOR_KEYS) {
    const value = payload[key];
    if (value !== undefined) result[key] = value;
  }

  return result;
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

/** "YYYY-MM" of the month before `now` — January rolls back to December. */
export function getPreviousMonth(now = new Date()): string {
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = String(previous.getMonth() + 1).padStart(2, '0');
  return `${previous.getFullYear()}-${month}`;
}

/** "2026-09" -> "setembro de 2026". */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}
