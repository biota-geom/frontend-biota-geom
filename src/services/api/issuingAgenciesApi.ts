import type { IssuingAgency } from '../../features/licenses/types';
import { request } from './http';
import type { IssuingAgencyWire } from './types';

function toIssuingAgency(wire: IssuingAgencyWire): IssuingAgency {
  return {
    id: wire.id,
    name: wire.name,
    acronym: wire.acronym,
  };
}

export async function listIssuingAgencies(): Promise<IssuingAgency[]> {
  const wire = await request<IssuingAgencyWire[]>('/api/issuing-agencies');
  return wire.map(toIssuingAgency);
}
