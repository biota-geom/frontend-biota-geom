export const ALERT_MESSAGES = {
  title: 'Notificações',
  viewAll: 'Ver todas',
  centralTitle: 'Central de notificações',
  description: 'Histórico de notificações de todas as suas empresas.',
  empty: 'Nenhuma notificação pendente',
  loading: 'Carregando notificações...',
  updating: 'Atualizando notificações...',
  retry: 'Tentar novamente',
  close: 'Fechar notificações',
  unread: 'Não lida',
  read: 'Lida',
  markingRead: 'Marcando como lida...',
  readError:
    'Não foi possível marcar a notificação como lida. Tente novamente.',
  dueDate: 'Vencimento',
  unavailableDate: 'Data indisponível',
  severity: {
    HIGH: 'Prioridade alta',
    MEDIUM: 'Prioridade média',
    LOW: 'Prioridade baixa',
  },
  triggerLabel: (count: number | null) =>
    count === null
      ? 'Notificações'
      : `Notificações, ${count} ${count === 1 ? 'não lida' : 'não lidas'}`,
  countError: 'Não foi possível atualizar o contador de notificações.',
  listError: 'Não foi possível carregar as notificações.',
} as const;
