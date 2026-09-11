import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import type { CompanyNavigationItem } from '../../features/companies/companyNavigation.mock';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../utils/cn';
import {
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
} from '../ui/icons';

type CompanyDropdownProps = {
  activeCompanyId?: string;
  companies?: CompanyNavigationItem[];
  className?: string;
};

export function CompanyDropdown({
  activeCompanyId,
  companies = [],
  className,
}: CompanyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Hook reutilizável — fecha o dropdown ao clicar fora
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const navigate = useNavigate();
  const location = useLocation();

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const activeLabel = activeCompany?.name ?? 'Empresa em contexto';

  const shouldShowSearch = companies.length > 10;

  // Filtra por nome, cidade ou segmento conforme o campo de busca
  const filteredCompanies = shouldShowSearch
    ? companies.filter((c) => {
        const query = searchTerm.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(query) ||
          (c.city && c.city.toLowerCase().includes(query)) ||
          (c.segment && c.segment.toLowerCase().includes(query))
        );
      })
    : companies;

  const handleSelectCompany = (companyId: string) => {
    setIsOpen(false);
    setSearchTerm('');

    if (companyId === activeCompanyId) return;

    // Captura o sufixo da URL após o segmento do companyId
    const match = location.pathname.match(/^\/companies\/([^/]+)(.*)$/);
    const suffix = match ? match[2] : '';
    const parts = suffix.split('/').filter(Boolean);

    // Rota aninhada com ID próprio (ex: /licenses/123) — redireciona para o
    // dashboard para evitar 404 ao trocar de empresa
    if (parts.length > 1) {
      navigate(`/companies/${companyId}/dashboard`);
    } else {
      const newPath = suffix
        ? `/companies/${companyId}${suffix}`
        : `/companies/${companyId}/dashboard`;
      navigate(newPath);
    }
  };

  return (
    <div className={cn('relative inline-block', className)} ref={ref}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Empresa em contexto"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        variant="context"
      >
        <BuildingIcon />
        <span className="max-w-[160px] truncate sm:max-w-[220px]">
          {activeLabel}
        </span>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <div
          aria-label="Lista de empresas"
          className="absolute top-full left-0 z-50 mt-1.5 min-w-[260px] max-w-[320px] rounded-lg border border-border bg-surface p-1.5 shadow-lg max-[640px]:left-auto max-[640px]:right-0"
          role="listbox"
        >
          {shouldShowSearch && (
            <div className="relative mb-1.5 px-1 pt-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center pt-1 text-text-muted">
                <SearchIcon />
              </div>
              <input
                aria-label="Buscar empresa"
                className="w-full rounded-md border border-border bg-surface-muted py-1.5 pr-2.5 pl-8 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-strong focus:outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa..."
                type="text"
                value={searchTerm}
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredCompanies.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-text-muted">
                Nenhuma empresa encontrada
              </div>
            ) : (
              filteredCompanies.map((company) => {
                const isSelected = company.id === activeCompanyId;
                return (
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-surface-muted focus:bg-surface-muted focus:outline-none',
                      isSelected &&
                        'bg-surface-muted font-semibold text-primary-strong'
                    )}
                    key={company.id}
                    onClick={() => handleSelectCompany(company.id)}
                    role="option"
                    type="button"
                  >
                    <div className="flex min-w-0 flex-col pr-2">
                      <span className="truncate text-sm font-medium">
                        {company.name}
                      </span>
                      {company.city && company.state && (
                        <span className="text-[11px] text-text-muted">
                          {company.city} - {company.state}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="shrink-0 text-primary-strong">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
