import { Link } from 'react-router-dom';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { buildCompanyRoutes } from '../../../../app/router/routes';

type LegislationRadarDashboardCardProps = {
  companyId: string;
};

/*
 * O Radar de Legislação existe apenas por licença (US31). O painel não lista
 * legislações: só indica onde o radar mora, apontando para as licenças da
 * Empresa — sem requisição própria.
 */
export function LegislationRadarDashboardCard({
  companyId,
}: LegislationRadarDashboardCardProps) {
  return (
    <Card aria-label="Radar de Legislação" variant="dashboard">
      <CardHeader variant="dashboard">
        <CardTitle variant="dashboard">Radar de Legislação</CardTitle>
        <CardAction variant="dashboard">
          <Link
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-strong no-underline hover:underline"
            to={buildCompanyRoutes.licenses(companyId)}
          >
            Ver licenças <span aria-hidden="true">→</span>
          </Link>
        </CardAction>
      </CardHeader>
      <p className="m-0 text-sm text-text-secondary">
        As legislações aplicáveis agora ficam nos detalhes de cada licença. Abra
        uma licença para consultar o seu radar.
      </p>
    </Card>
  );
}
