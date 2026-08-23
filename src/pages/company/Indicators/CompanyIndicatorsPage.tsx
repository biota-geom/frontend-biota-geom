import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';

export function CompanyIndicatorsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Indicadores ESG');

  return (
    <PageScaffold
      actions={[{ icon: 'none', label: 'Gerar Relatório' }]}
      breadcrumbs={breadcrumbs}
      subtitle="Métricas de desempenho ambiental, social e de sustentabilidade corporativa."
      title="Indicadores ESG"
    >
      <RoutePlaceholder description="Os indicadores ESG vinculados à empresa serão implementados em uma etapa futura." />
    </PageScaffold>
  );
}
