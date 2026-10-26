import { z } from 'zod';
import type { EsgIndicatorsPayload, MonthlyIndicator } from './types';

export const INDICATOR_CATEGORIES = [
  'Ambiental',
  'Social',
  'Governança',
] as const;
export type IndicatorCategory = (typeof INDICATOR_CATEGORIES)[number];

export const INVALID_NUMBER_MESSAGE = 'Informe um número válido.';
export const NEGATIVE_NUMBER_MESSAGE = 'O valor não pode ser negativo.';
export const DECIMAL_PLACES_MESSAGE = 'Use no máximo 4 casas decimais.';
export const REQUIRED_FIELD_MESSAGE = 'Este campo é obrigatório.';

const MAX_INDICATOR_VALUE = 99_999_999_999_999;

/*
 * Every value field is a string in the form (empty = not informed).
 * Partial submission is valid: blank means "not informed", not zero.
 */
export const numericIndicatorField = z
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
    if (parsed > MAX_INDICATOR_VALUE) {
      context.addIssue({
        code: 'custom',
        message: 'O valor do indicador excede o limite permitido.',
      });
      return;
    }
    // The backend stores NUMERIC(18,4) and answers 400 beyond 4 decimals.
    if (Number(parsed.toFixed(4)) !== parsed) {
      context.addIssue({ code: 'custom', message: DECIMAL_PLACES_MESSAGE });
    }
  });

/**
 * Schema for the dynamic inline-creation form (Name, Unit, Category).
 */
export const newIndicatorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do indicador.')
    .max(120, 'O nome do indicador excede o tamanho permitido.'),
  unit: z
    .string()
    .trim()
    .min(1, 'Informe a unidade de medida.')
    .max(30, 'A unidade de medida excede o tamanho permitido.'),

  category: z.enum(INDICATOR_CATEGORIES, {
    error: 'Selecione uma categoria válida.',
  }),
});

export type NewIndicatorFormValues = z.infer<typeof newIndicatorSchema>;

export const EMPTY_NEW_INDICATOR_VALUES: NewIndicatorFormValues = {
  name: '',
  unit: '',
  category: 'Ambiental',
};

/**
 * Converts the form's string map (keyed by indicator_id) into the API payload.
 * A blank field with a previously saved value becomes null (clear).
 * A blank field with no previous value is omitted.
 */
export function toPayload(
  values: Record<string, string>,
  saved: MonthlyIndicator[]
): EsgIndicatorsPayload {
  const records: EsgIndicatorsPayload['records'] = [];

  for (const indicator of saved) {
    const raw = values[indicator.indicator_id] ?? '';
    if (raw !== '') {
      records.push({
        indicator_id: indicator.indicator_id,
        value: Number(raw),
      });
    } else if (indicator.value !== null) {
      // Field was cleared — send null to remove the saved record.
      records.push({ indicator_id: indicator.indicator_id, value: null });
    }
    // Blank + never saved → omit (backend leaves untouched).
  }

  return { records };
}

/**
 * Initialises the form values string-map from the loaded indicators.
 * null values become '' (empty string).
 */
export function toFormValues(
  indicators: MonthlyIndicator[]
): Record<string, string> {
  return Object.fromEntries(
    indicators.map((ind) => [
      ind.indicator_id,
      ind.value === null ? '' : String(ind.value),
    ])
  );
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
