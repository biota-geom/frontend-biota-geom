import { z } from 'zod';

export const LICENSE_CONDITION_STATUSES = [
  'Regular',
  'Atenção',
  'Risco',
] as const;

export const DUE_DATE_REQUIRED_MESSAGE =
  'A data de vencimento é obrigatória para registar a condicionante.';

export const TARGET_OPERATORS = [
  { value: 'LTE', label: 'Menor ou igual a' },
  { value: 'GTE', label: 'Maior ou igual a' },
  { value: 'EQ', label: 'Igual a' },
] as const;

export type TargetOperator = (typeof TARGET_OPERATORS)[number]['value'];

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createLicenseConditionSchema(now = new Date()) {
  const today = toLocalIsoDate(now);

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Informe o nome da condicionante.')
        .max(160, 'O nome deve ter no máximo 160 caracteres.'),
      esgMetricId: z.string().min(1, 'Selecione a categoria.'),
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
      description: z
        .string()
        .trim()
        .max(500, 'A descrição deve ter no máximo 500 caracteres.'),
      // Compliance target (US17): metric, operator and value go together.
      targetMetricId: z.string(),
      targetOperator: z.union([
        z.literal(''),
        z.enum(TARGET_OPERATORS.map((operator) => operator.value)),
      ]),
      targetValue: z.string().trim(),
    })
    .superRefine((values, context) => {
      const filled = [
        values.targetMetricId,
        values.targetOperator,
        values.targetValue,
      ].filter((field) => field !== '');

      if (filled.length === 0) return;

      if (values.targetMetricId === '') {
        context.addIssue({
          code: 'custom',
          path: ['targetMetricId'],
          message: 'Selecione a métrica ESG da meta.',
        });
      }
      if (values.targetOperator === '') {
        context.addIssue({
          code: 'custom',
          path: ['targetOperator'],
          message: 'Selecione o operador da meta.',
        });
      }
      if (
        values.targetValue === '' ||
        !Number.isFinite(Number(values.targetValue))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['targetValue'],
          message: 'Informe um valor numérico para a meta.',
        });
      }
    });
}

export type CreateLicenseConditionForm = z.infer<
  ReturnType<typeof createLicenseConditionSchema>
>;
