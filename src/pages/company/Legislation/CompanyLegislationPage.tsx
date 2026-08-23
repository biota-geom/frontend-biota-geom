import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder'
import { PageScaffold } from '../../../components/layout/PageScaffold'
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs'

export function CompanyLegislationPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Legislação')

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Atualizações regulatórias e análise de impacto operacional."
      title="Radar de legislação ambiental"
    >
      <RoutePlaceholder description="A legislação aplicável ao contexto da empresa será implementada em uma etapa futura." />
    </PageScaffold>
  )
}
