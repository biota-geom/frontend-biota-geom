/**
 * Text for the "Condicionantes" column of the licenses panel, built from the
 * `conditions_summary` counts the API serves for each license.
 */
export function formatConditionStatus(attended: number, total: number): string {
  if (total === 0) return 'Análise pendente';
  if (attended >= total) return 'Todas atendidas';
  return `${attended} de ${total} atendidas`;
}
