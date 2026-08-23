import { Link } from 'react-router-dom';
import { buildCompanyRoutes } from '../../../app/router/routes';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  MOCK_COMPANY_NAVIGATION_ITEMS,
  type CompanyNavigationItem,
} from '../../../features/companies/companyNavigation.mock';
import styles from './AdminCompaniesPage.module.css';

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.75 17.25C14.34 17.25 17.25 14.34 17.25 10.75C17.25 7.16 14.34 4.25 10.75 4.25C7.16 4.25 4.25 7.16 4.25 10.75C4.25 14.34 7.16 17.25 10.75 17.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M15.5 15.5L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 19H9L18.25 9.75L14.25 5.75L5 15V19Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.25 6.75L17.25 10.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 7.75H17.25M10 10.75V16.25M14 10.75V16.25M9.25 7.75L9.75 5.25H14.25L14.75 7.75M8.25 7.75L8.75 19.25H15.25L15.75 7.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function getComplianceTone(compliance: number) {
  if (compliance >= 90) {
    return styles.good;
  }

  if (compliance >= 70) {
    return styles.warning;
  }

  return styles.danger;
}

function getStatusLabel(status: CompanyNavigationItem['status']) {
  return status === 'active' ? 'Ativo' : 'Inativo';
}

export function AdminCompaniesPage() {
  return (
    <PageScaffold
      actions={[{ label: 'Nova Empresa' }]}
      subtitle="Gerencie os dados, licenças e conformidade das empresas cadastradas."
      title="Empresas cadastradas"
    >
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <SearchIcon />
          <span className={styles.visuallyHidden}>Buscar empresas</span>
          <input
            disabled
            placeholder="Buscar por nome da filial, estado ou segmento..."
            type="search"
          />
        </label>

        <button className={styles.filterButton} disabled type="button">
          Segmento: Todos
          <ChevronDownIcon />
        </button>
        <button className={styles.filterButton} disabled type="button">
          Status: Ativos
          <ChevronDownIcon />
        </button>
      </div>

      <section aria-label="Empresas cadastradas" className={styles.grid}>
        {MOCK_COMPANY_NAVIGATION_ITEMS.map((company) => {
          const complianceTone = getComplianceTone(company.compliance);

          return (
            <article
              aria-labelledby={`company-${company.id}-title`}
              className={styles.card}
              key={company.id}
            >
              <header className={styles.cardHeader}>
                <div className={styles.companyTitle}>
                  <h2 id={`company-${company.id}-title`}>{company.name}</h2>
                  <p>
                    {company.segment} • {company.city} - {company.state}
                  </p>
                </div>

                <div className={styles.cardActions}>
                  <span
                    className={[
                      styles.statusBadge,
                      company.status === 'active'
                        ? styles.statusActive
                        : styles.statusInactive,
                    ].join(' ')}
                  >
                    {getStatusLabel(company.status)}
                  </span>
                  <button
                    aria-label={`Editar ${company.name}`}
                    className={[styles.iconButton, styles.editButton].join(' ')}
                    disabled
                    type="button"
                  >
                    <EditIcon />
                  </button>
                  <button
                    aria-label={`Excluir ${company.name}`}
                    className={[styles.iconButton, styles.deleteButton].join(
                      ' '
                    )}
                    disabled
                    type="button"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </header>

              <dl className={styles.metrics}>
                <div>
                  <dt>Licenças</dt>
                  <dd>{company.licenseCount}</dd>
                </div>
                <div>
                  <dt>Conformidade</dt>
                  <dd className={complianceTone}>
                    <span className={styles.dot} />
                    {company.compliance}%
                  </dd>
                </div>
                <div>
                  <dt>Atenção</dt>
                  <dd
                    className={
                      company.attentionCount > 0 ? styles.warning : styles.good
                    }
                  >
                    <span className={styles.dot} />
                    {company.attentionCount}
                  </dd>
                </div>
                <div>
                  <dt>Vencido</dt>
                  <dd
                    className={
                      company.overdueCount > 0 ? styles.danger : styles.good
                    }
                  >
                    <span className={styles.dot} />
                    {company.overdueCount}
                  </dd>
                </div>
              </dl>

              <footer className={styles.cardFooter}>
                <span>Última atualização: {company.updatedAt}</span>
                <Link
                  className={styles.detailsLink}
                  to={buildCompanyRoutes.dashboard(company.id)}
                >
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </footer>
            </article>
          );
        })}
      </section>
    </PageScaffold>
  );
}
