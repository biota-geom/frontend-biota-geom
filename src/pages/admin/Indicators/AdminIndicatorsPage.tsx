import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder';
import { PageScaffold } from '../../../components/layout/PageScaffold';

export function AdminIndicatorsPage() {
  return (
    <PageScaffold
      actions={[{ label: 'Novo Indicador' }]}
      subtitle="Cadastre e gerencie os indicadores ESG monitorados por empresa."
      title="Gestão de indicadores ESG"
    >
      <RoutePlaceholder description="A administração global de indicadores ESG será implementada em uma etapa futura." />
    </PageScaffold>
  );
}
