import React, { useState, useEffect } from 'react';

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
      // AQUI: chamar onFilterChange, passando o objeto com search, segment_id, status
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
    <div>
      <div className="flex gap-4 items-center"></div>
      {/* O campo de busca de texto */}
      <input
        type="search"
        placeholder="Buscar por nome da filial, estado ou segmento..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      {/* Dropdown Dinâmico (Segmento) */}
      <select
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
