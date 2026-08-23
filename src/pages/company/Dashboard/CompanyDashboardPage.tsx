import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder'
import { PageScaffold } from '../../../components/layout/PageScaffold'
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs'

export function CompanyDashboardPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Painel')

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Monitoramento de conformidade ambiental no contexto da empresa."
      title="Painel de controle"
    >
      <RoutePlaceholder description="O painel de controle da empresa será implementado em uma etapa futura." />
    </PageScaffold>
  )
}
