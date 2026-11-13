export const ALERT_MESSAGES = {
  title: 'Notificações',
  description: 'Alertas pendentes das suas empresas.',
  empty: 'Nenhuma notificação pendente',
  loading: 'Carregando notificações...',
  updating: 'Atualizando notificações...',
  retry: 'Tentar novamente',
  close: 'Fechar notificações',
  unread: 'Não lida',
  read: 'Lida',
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
