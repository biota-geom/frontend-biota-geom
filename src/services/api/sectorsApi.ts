import type { Sector } from '../../features/companies/types';
import { request } from './http';
import type { SectorWire } from './types';

function toSector(wire: SectorWire): Sector {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
  };
}

export async function listSectors(): Promise<Sector[]> {
  const wire = await request<SectorWire[]>('/api/sectors');
  return wire.map(toSector);
}
