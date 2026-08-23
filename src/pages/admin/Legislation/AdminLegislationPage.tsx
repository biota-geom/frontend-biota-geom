import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder';
import { PageScaffold } from '../../../components/layout/PageScaffold';

export function AdminLegislationPage() {
  return (
    <PageScaffold
      actions={[{ label: 'Nova Legislação' }]}
      subtitle="Cadastre e gerencie as legislações analisadas para as empresas."
      title="Gestão de legislação ambiental"
    >
      <RoutePlaceholder description="O catálogo global de legislação ambiental será implementado em uma etapa futura." />
    </PageScaffold>
  );
}
