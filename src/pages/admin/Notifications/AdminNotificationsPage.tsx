import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { ALERT_MESSAGES } from '../../../features/alerts/alertMessages';

export function AdminNotificationsPage() {
  return (
    <PageScaffold
      title={ALERT_MESSAGES.centralTitle}
      subtitle={ALERT_MESSAGES.description}
    >
      <RoutePlaceholder description={ALERT_MESSAGES.centralPlaceholder} />
    </PageScaffold>
  );
}
