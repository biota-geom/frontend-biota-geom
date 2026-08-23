import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder'
import { PageScaffold } from '../../../components/layout/PageScaffold'
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs'

export function CompanyDocumentsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Documentos')

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Estrutura reservada para documentos associados ao contexto da empresa."
      title="Documentos"
    >
      <RoutePlaceholder description="A área de documentos da empresa será implementada em uma etapa futura." />
    </PageScaffold>
  )
}
