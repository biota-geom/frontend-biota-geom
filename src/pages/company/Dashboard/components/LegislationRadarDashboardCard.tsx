import { Card, CardHeader, CardTitle } from '@/components/ui/shadcn/card';

/*
 * Reserved slot: the Legislation Radar ships in Sprint 4. Until then the card
 * only holds its place in the panel, with no request and no link.
 */
export function LegislationRadarDashboardCard() {
  return (
    <Card aria-label="Radar de Legislação" variant="dashboard">
      <CardHeader variant="dashboard">
        <CardTitle variant="dashboard">Radar de Legislação</CardTitle>
        <span className="rounded-control bg-surface-muted px-2 py-1 text-[11px] font-bold text-text-secondary">
          Em breve
        </span>
      </CardHeader>
      <p className="m-0 text-sm text-text-secondary">
        O acompanhamento das legislações aplicáveis à empresa estará disponível
        em breve.
      </p>
    </Card>
  );
}
