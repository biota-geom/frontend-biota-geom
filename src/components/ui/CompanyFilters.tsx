import React, { useState, useEffect } from 'react';
import { SearchIcon } from './icons';

// 1. A Interface
interface SegmentOption {
  id: string;
  name: string;
}

interface CompanyFiltersProps {
  segments: SegmentOption[];
  onFilterChange: (filters: CompanyFilterValues) => void;
}

interface CompanyFilterValues {
  search: string;
  segment_id: string;
  status: string;
}

// 2. O Componente e os Estados
export const CompanyFilters: React.FC<CompanyFiltersProps> = ({
  segments,
  onFilterChange,
}) => {
  const [searchText, setSearchText] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      onFilterChange({
        search: searchText,
        segment_id: segmentId,
        status: status,
      });
    }, 500);

    return () => {
      clearTimeout(id);
    };
  }, [searchText, segmentId, status, onFilterChange]);

  // 3. O Retorno (JSX)
  return (
    <div className="rounded-panel mb-8 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border border-border bg-surface p-4 max-[820px]:grid-cols-1">
      {/* O campo de busca de texto */}
      <label className="rounded-control flex min-h-[38px] items-center gap-2.5 bg-surface-muted px-2.5 text-text-secondary">
        <SearchIcon />
        <span className="sr-only">Buscar empresas</span>
        <input
          className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
          type="search"
          placeholder="Buscar por nome da filial, estado ou segmento..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </label>

      {/* Dropdown Dinâmico (Segmento) */}
      <select
        className="rounded-control min-h-[38px] border border-border bg-surface px-4 text-text-secondary"
        value={segmentId}
        onChange={(e) => {
          const novoSegmentId = e.target.value;
          setSegmentId(novoSegmentId);
          onFilterChange({
            search: searchText,
            segment_id: novoSegmentId,
            status: status,
          });
        }}
      >
        <option value="">Segmento: Todos</option>
        {segments.map((seg) => (
          <option key={seg.id} value={seg.id}>
            Segmento: {seg.name}
          </option>
        ))}
      </select>

      {/* Dropdown Estático (Status) */}
      <select
        className="rounded-control min-h-[38px] border border-border bg-surface px-4 text-text-secondary"
        value={status}
        onChange={(e) => {
          const statusAtual = e.target.value;
          setStatus(statusAtual);
          onFilterChange({
            search: searchText,
            segment_id: segmentId,
            status: statusAtual,
          });
        }}
      >
        <option value="">Status: Todos</option>
        <option value="ativos">Status: Ativos</option>
        <option value="inativos">Status: Inativos</option>
      </select>
    </div>
  );
};
