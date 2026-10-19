import { Card, CardHeader, CardTitle } from '@/components/ui/shadcn/card';

export function EnvironmentalObligationsDashboardCard() {
  return (
    <Card
      aria-label="Obrigações ambientais"
      className="min-h-full"
      variant="dashboard"
    >
      <CardHeader variant="dashboard">
        <CardTitle variant="dashboard">Obrigações Ambientais</CardTitle>
      </CardHeader>

      <div
        aria-label="Área reservada para o resumo das obrigações ambientais"
        className="flex flex-1 flex-col gap-5"
      ></div>
    </Card>
  );
}
