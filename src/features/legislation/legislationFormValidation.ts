import { z } from 'zod';
import { LEGISLATION_TYPES } from './legislationFormatting';
import type { LegislationInput, LegislationType } from './types';

// 4 digits, from 1000 on: the backend accepts years 1000-9999.
const MIN_YEAR = 1000;

/*
 * Mirrors the backend limits (VarChar sizes and the 4-digit year) so the form
 * flags a value before the request instead of after a 400.
 */
export const legislationFormSchema = z.object({
  type: z.enum(LEGISLATION_TYPES as [LegislationType, ...LegislationType[]], {
    message: 'Selecione o tipo da legislação.',
  }),
  number: z
    .string()
    .trim()
    .min(1, 'Informe o número da legislação.')
    .max(50, 'O número deve ter no máximo 50 caracteres.'),
  // One message at a time: an empty year should not also read as malformed.
  year: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = !value
        ? 'Informe o ano da legislação.'
        : !/^\d{4}$/.test(value)
          ? 'Informe um ano com 4 dígitos.'
          : Number(value) < MIN_YEAR
            ? 'Informe um ano válido.'
            : null;
      if (message) ctx.addIssue({ code: 'custom', message });
    }),
  // Required: it is part of the catalog identity, so an act typed without it
  // would not match the same act already registered with one.
  issuingBody: z
    .string()
    .trim()
    .min(1, 'Informe o órgão emissor.')
    .max(150, 'O órgão emissor deve ter no máximo 150 caracteres.'),
  summary: z
    .string()
    .trim()
    .max(4095, 'A ementa deve ter no máximo 4095 caracteres.'),
  citedExcerpt: z
    .string()
    .trim()
    .max(4095, 'O trecho citado deve ter no máximo 4095 caracteres.'),
});

/** Raw form state: every field is the text the operator typed. */
export type LegislationFormValues = z.input<typeof legislationFormSchema>;
export type ParsedLegislationForm = z.output<typeof legislationFormSchema>;

/** What the form hands to its caller once valid. */
export interface LegislationFormResult {
  legislation: LegislationInput;
  citedExcerpt: string | null;
}

export const EMPTY_LEGISLATION_FORM: LegislationFormValues = {
  type: '' as LegislationType,
  number: '',
  year: '',
  issuingBody: '',
  summary: '',
  citedExcerpt: '',
};

export function toLegislationFormResult(
  values: ParsedLegislationForm
): LegislationFormResult {
  return {
    legislation: {
      type: values.type,
      number: values.number,
      year: Number(values.year),
      issuingBody: values.issuingBody,
      summary: values.summary || null,
    },
    citedExcerpt: values.citedExcerpt || null,
  };
}

/** True when the act fields differ from the act being edited. */
export function hasLegislationChanged(
  current: LegislationInput,
  edited: LegislationInput
): boolean {
  return (
    current.type !== edited.type ||
    current.number !== edited.number ||
    current.year !== edited.year ||
    current.issuingBody !== edited.issuingBody ||
    (current.summary ?? null) !== (edited.summary ?? null)
  );
}
