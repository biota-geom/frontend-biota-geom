import {
  Card,
  CardDescription,
  CardTitle,
  type CardTone,
} from '@/components/ui/shadcn/card';
import type { LicenseSummary } from '../../../../features/licenses/types';

interface SummaryCardSpec {
  key: keyof LicenseSummary;
  label: string;
  tone: CardTone;
}

const SUMMARY_CARDS: SummaryCardSpec[] = [
  { key: 'total', label: 'Total de Licenças', tone: 'total' },
  { key: 'regular', label: 'Regulares', tone: 'regular' },
  { key: 'attention', label: 'Atenção', tone: 'attention' },
  { key: 'expired', label: 'Vencidas', tone: 'expired' },
];

interface LicensesSummaryCardsProps {
  summary: LicenseSummary;
}

export function LicensesSummaryCards({ summary }: LicensesSummaryCardsProps) {
  return (
    <section
      aria-label="Resumo das licenças"
      className="mb-8 grid grid-cols-4 gap-6 max-[900px]:grid-cols-2"
    >
      {SUMMARY_CARDS.map(({ key, label, tone }) => (
        <Card key={key} tone={tone} variant="stat">
          <CardDescription variant="stat">{label}</CardDescription>
          <CardTitle tone={tone} variant="stat">
            {summary[key]}
          </CardTitle>
        </Card>
      ))}
    </section>
  );
}
