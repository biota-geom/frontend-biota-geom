import type {
  LegislationWire,
  LicenseLegislationWire,
} from '../../services/api/types';

/*
 * Stand-in for `/licenses/:id/legislations` until the radar endpoints land.
 * It covers every state the radar renders: scanned and manual entries, each
 * impact level and no impact yet, read and unread, with and without analysis.
 */
export const MOCK_LEGISLATIONS: LegislationWire[] = [
  {
    id: '0198f5a0-0000-7000-8000-000000000001',
    type: 'LEI',
    number: '12.305',
    year: 2010,
    issuing_body: 'Governo Federal',
    summary: 'Institui a Política Nacional de Resíduos Sólidos.',
  },
  {
    id: '0198f5a0-0000-7000-8000-000000000002',
    type: 'RESOLUCAO',
    number: '237',
    year: 1997,
    issuing_body: 'CONAMA',
    summary:
      'Dispõe sobre os procedimentos e critérios do licenciamento ambiental.',
  },
  {
    id: '0198f5a0-0000-7000-8000-000000000003',
    type: 'LEI',
    number: '9.605',
    year: 1998,
    issuing_body: 'Governo Federal',
    summary:
      'Dispõe sobre as sanções penais e administrativas derivadas de condutas e atividades lesivas ao meio ambiente.',
  },
];

export const MOCK_LICENSE_LEGISLATIONS: LicenseLegislationWire[] = [
  {
    id: '0198f5a1-0000-7000-8000-000000000001',
    legislation: MOCK_LEGISLATIONS[0],
    source: 'SCAN',
    cited_excerpt: '…conforme a Lei nº 12.305/2010…',
    impact: 'HIGH',
    technical_analysis: null,
    read_at: null,
    created_at: '2026-11-02T12:00:00.000Z',
  },
  {
    id: '0198f5a1-0000-7000-8000-000000000002',
    legislation: MOCK_LEGISLATIONS[1],
    source: 'SCAN',
    cited_excerpt:
      '…licença emitida nos termos da Resolução CONAMA nº 237/1997…',
    impact: null,
    technical_analysis: null,
    read_at: '2026-11-02T15:30:00.000Z',
    created_at: '2026-11-02T12:00:00.000Z',
  },
  {
    id: '0198f5a1-0000-7000-8000-000000000003',
    legislation: MOCK_LEGISLATIONS[2],
    source: 'MANUAL',
    cited_excerpt: null,
    impact: 'MODERATE',
    technical_analysis:
      'O descumprimento das condicionantes pode configurar infração administrativa e penal ambiental.',
    read_at: null,
    created_at: '2026-11-01T09:00:00.000Z',
  },
];
