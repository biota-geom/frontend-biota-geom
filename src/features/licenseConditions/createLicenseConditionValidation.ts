import { z } from 'zod';

export const LICENSE_CONDITION_STATUSES = [
  'Regular',
  'Atenção',
  'Risco',
] as const;

export const DUE_DATE_REQUIRED_MESSAGE =
  'A data de vencimento é obrigatória para registar a condicionante.';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createLicenseConditionSchema(now = new Date()) {
  const today = toLocalIsoDate(now);

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome da condicionante.')
      .max(160, 'O nome deve ter no máximo 160 caracteres.'),
    environmentalDescriptor: z
      .string()
      .trim()
      .min(1, 'Informe o descritor ambiental.')
      .max(120, 'O descritor ambiental deve ter no máximo 120 caracteres.'),
    licenseId: z.string().min(1, 'Selecione a licença vinculada.'),
    responsibleAgency: z
      .string()
      .trim()
      .min(1, 'Informe o órgão responsável.')
      .max(150, 'O órgão responsável deve ter no máximo 150 caracteres.'),
    dueDate: z
      .string()
      .min(1, DUE_DATE_REQUIRED_MESSAGE)
      .refine((value) => value === '' || value > today, {
        message: 'A data de vencimento deve ser futura.',
      }),
    status: z.enum(LICENSE_CONDITION_STATUSES),
    hasDelivery: z.boolean(),
    description: z
      .string()
      .trim()
      .max(500, 'A descrição deve ter no máximo 500 caracteres.'),
  });
}

export type CreateLicenseConditionForm = z.infer<
  ReturnType<typeof createLicenseConditionSchema>
>;

export const editLicenseConditionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da condicionante.')
    .max(160, 'O nome deve ter no máximo 160 caracteres.'),
  environmentalDescriptor: z
    .string()
    .trim()
    .min(1, 'Informe o descritor ambiental.')
    .max(120, 'O descritor ambiental deve ter no máximo 120 caracteres.'),
  responsibleAgency: z
    .string()
    .trim()
    .max(150, 'O órgão responsável deve ter no máximo 150 caracteres.'),
  dueDate: z.string().min(1, DUE_DATE_REQUIRED_MESSAGE),
  hasDelivery: z.boolean(),
  isViolated: z.boolean(),
  description: z
    .string()
    .trim()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.'),
});

export type EditLicenseConditionForm = z.infer<
  typeof editLicenseConditionSchema
>;
