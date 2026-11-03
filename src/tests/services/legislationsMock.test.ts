import { describe, expect, it } from 'vitest';
import {
  MOCK_LEGISLATIONS,
  MOCK_LICENSE_LEGISLATIONS,
} from '../../features/legislation/legislations.mock';

describe('legislations mock', () => {
  it('uses the radar item contract keys', () => {
    for (const item of MOCK_LICENSE_LEGISLATIONS) {
      expect(Object.keys(item).sort()).toEqual(
        [
          'cited_excerpt',
          'created_at',
          'id',
          'impact',
          'legislation',
          'read_at',
          'source',
          'technical_analysis',
        ].sort()
      );
      expect(Object.keys(item.legislation).sort()).toEqual(
        ['id', 'issuing_body', 'number', 'summary', 'type', 'year'].sort()
      );
    }
  });

  it('links each radar item to a distinct catalog legislation', () => {
    const linked = MOCK_LICENSE_LEGISLATIONS.map((item) => item.legislation.id);

    expect(new Set(linked).size).toBe(linked.length);
    expect(linked).toEqual(MOCK_LEGISLATIONS.map(({ id }) => id));
  });

  it('exercises both sources, read and unread, and an unrated impact', () => {
    const items = MOCK_LICENSE_LEGISLATIONS;

    expect(new Set(items.map(({ source }) => source))).toEqual(
      new Set(['SCAN', 'MANUAL'])
    );
    expect(items.some(({ read_at }) => read_at === null)).toBe(true);
    expect(items.some(({ read_at }) => read_at !== null)).toBe(true);
    expect(items.some(({ impact }) => impact === null)).toBe(true);
  });
});
