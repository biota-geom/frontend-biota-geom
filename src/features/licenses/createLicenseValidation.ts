import { z } from 'zod';
import type { LicenseConditionBatchItemInput } from '../../services/api/licenseConditionsApi';
import type { LicenseType } from './types';

export const LICENSE_TYPES: LicenseType[] = ['LP', 'LI', 'LO'];

export const CONDITION_TYPES = ['INFORMATIVE', 'PERIODIC'] as const;
export const CONDITION_PERIODICITIES = [
  'MONTHLY',
  'QUARTERLY',
  'SEMIANNUAL',
  'ANNUAL',
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const INVALID_FILE_TYPE_MESSAGE = 'O arquivo deve estar no formato PDF.';
export const FILE_TOO_LARGE_MESSAGE = 'O arquivo não pode ultrapassar 5MB.';
export const FILE_REQUIRED_MESSAGE = 'Anexe o documento em PDF.';
export const INVALID_DATE_RANGE_MESSAGE =
  'A data de validade deve ser posterior à data de emissão.';

export const licenseConditionRowSchema = z
  .object({
    environmentalDescriptor: z
      .string()
      .trim()
      .min(1, 'Informe o descritor ambiental.')
      .max(120, 'O descritor ambiental deve ter no máximo 120 caracteres.'),
    description: z
      .string()
      .trim()
      .min(1, 'Informe a descrição.')
      .max(500, 'A descrição deve ter no máximo 500 caracteres.'),
    conditionType: z
      .string()
      .min(1, 'Selecione o tipo.')
      .refine(
        (value) =>
          CONDITION_TYPES.includes(value as (typeof CONDITION_TYPES)[number]),
        'Selecione um tipo válido.'
      ),
    periodicity: z.string(),
    deadline: z.string().min(1, 'Informe o prazo.'),
    responsibleName: z
      .string()
      .trim()
      .min(1, 'Informe o responsável.')
      .max(150, 'O responsável deve ter no máximo 150 caracteres.'),
    hasDelivery: z.boolean(),
  })
  .superRefine((condition, context) => {
    if (
      condition.conditionType === 'PERIODIC' &&
      !CONDITION_PERIODICITIES.includes(
        condition.periodicity as (typeof CONDITION_PERIODICITIES)[number]
      )
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Selecione uma periodicidade válida.',
        path: ['periodicity'],
      });
    }
  });

export type LicenseConditionRow = {
  environmentalDescriptor: string;
  description: string;
  conditionType: string;
  periodicity: string;
  deadline: string;
  responsibleName: string;
  hasDelivery: boolean;
};

export type CreateLicenseForm = {
  type: string;
  processNumber: string;
  issuingAgencyId: string;
  issueDate: string;
  expirationDate: string;
  file: File | null;
  conditions: LicenseConditionRow[];
};

export const createLicenseSchema: z.ZodType<
  CreateLicenseForm,
  CreateLicenseForm
> = z
  .object({
    type: z
      .string()
      .min(1, 'Selecione o tipo de licença.')
      .refine(
        (value) => LICENSE_TYPES.includes(value as LicenseType),
        'Selecione um tipo válido.'
      ),
    processNumber: z.string().trim().min(1, 'Informe o nº do processo.'),
    issuingAgencyId: z.string().min(1, 'Selecione o órgão emissor.'),
    issueDate: z.string().min(1, 'Informe a data de emissão.'),
    expirationDate: z.string().min(1, 'Informe a data de validade.'),
    file: z
      .custom<File | null>()
      .refine((file) => file !== null, FILE_REQUIRED_MESSAGE)
      .refine(
        (file) => file === null || file.type === 'application/pdf',
        INVALID_FILE_TYPE_MESSAGE
      )
      .refine(
        (file) => file === null || file.size <= MAX_FILE_SIZE_BYTES,
        FILE_TOO_LARGE_MESSAGE
      ),
    conditions: z.array(licenseConditionRowSchema),
  })
  .refine(
    (data) =>
      !data.issueDate ||
      !data.expirationDate ||
      data.expirationDate > data.issueDate,
    { message: INVALID_DATE_RANGE_MESSAGE, path: ['expirationDate'] }
  );

export const EMPTY_CONDITION_ROW: LicenseConditionRow = {
  environmentalDescriptor: '',
  description: '',
  conditionType: '',
  periodicity: '',
  deadline: '',
  responsibleName: '',
  hasDelivery: true,
};

export const CREATE_LICENSE_DEFAULT_VALUES: CreateLicenseForm = {
  type: '',
  processNumber: '',
  issuingAgencyId: '',
  issueDate: '',
  expirationDate: '',
  file: null,
  conditions: [],
};

export type AddLicenseConditionsForm = {
  conditions: LicenseConditionRow[];
};

export const addLicenseConditionsSchema: z.ZodType<
  AddLicenseConditionsForm,
  AddLicenseConditionsForm
> = z.object({
  conditions: z
    .array(licenseConditionRowSchema)
    .min(1, 'Adicione ao menos uma condicionante.'),
});

export const ADD_LICENSE_CONDITIONS_DEFAULT_VALUES: AddLicenseConditionsForm = {
  conditions: [],
};

export function toUtcIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function toLicenseConditionBatchItem(
  row: LicenseConditionRow
): LicenseConditionBatchItemInput {
  return {
    environmentalDescriptor: row.environmentalDescriptor,
    description: row.description,
    conditionType: row.conditionType,
    periodicity: row.periodicity || undefined,
    deadline: toUtcIsoDate(row.deadline),
    responsibleName: row.responsibleName,
    hasDelivery: row.hasDelivery,
  };
}
