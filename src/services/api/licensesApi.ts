import type {
  License,
  LicenseDashboard,
  LicenseDetails,
  LicenseDocumentUrl,
  LicenseExtraction,
  LicensePanelItem,
  LicensesPanel,
  LicenseRenewed,
  LicenseVersion,
  RenewalConditionDecision,
} from '../../features/licenses/types';
import { ApiError } from './apiError';
import { request } from './http';
import type {
  LicenseDocumentUrlWire,
  LicenseHistoryItemWire,
  LicensePanelItemWire,
  LicenseDetailsWire,
  LicenseExtractionJobWire,
  LicenseExtractionWire,
  LicensePanelResponseWire,
  LicenseDashboardWire,
  LicenseRenewedWire,
  LicenseWire,
  RenewalConditionWire,
  StartLicenseExtractionWire,
} from './types';

export interface CreateLicenseInput {
  type: string;
  processNumber: string;
  issuingAgency: string;
  /** `YYYY-MM-DD`, straight from a `<input type="date">`. */
  issueDate: string;
  /** `YYYY-MM-DD`, straight from a `<input type="date">`. */
  expirationDate: string;
  documentFile: File;
}

export interface RenewLicenseInput {
  processNumber: string;
  issueDate: string;
  expirationDate: string;
  documentFile: File;
  /** One decision per condition of the previous license; empty when it has none. */
  conditions: RenewalConditionDecision[];
}

function toRenewalConditionWire(
  decision: RenewalConditionDecision
): RenewalConditionWire {
  return {
    condition_id: decision.conditionId,
    fulfilled: decision.fulfilled,
    copy_to_new: decision.copyToNew,
    ...(decision.newDueDate ? { new_due_date: decision.newDueDate } : {}),
  };
}

function toLicense(wire: LicenseWire): License {
  return {
    id: wire.id,
    customerId: wire.customer_id,
    type: wire.type,
    processNumber: wire.process_number,
    issuingAgency: wire.issuing_agency,
    issueDate: wire.issue_date,
    expirationDate: wire.expiration_date,
    status: wire.status,
    documentUrl: wire.document_url,
    createdAt: wire.created_at,
  };
}

function toLicenseDetails(wire: LicenseDetailsWire): LicenseDetails {
  return {
    id: wire.id,
    processNumber: wire.process_number,
    type: wire.type,
    issuingAgency: wire.issuing_agency,
    issueDate: wire.issue_date,
    expirationDate: wire.expiration_date,
    status: wire.status,
    conditions: wire.conditions.map((condition) => ({
      id: condition.id,
      itemNumber: condition.item_number,
      isEnvironmentalDescriptor: condition.is_environmental_descriptor,
      environmentalDescriptor: condition.environmental_descriptor,
      name: condition.name,
      description: condition.description,
      conditionType: condition.condition_type,
      periodicity: condition.periodicity,
      deadline: condition.deadline,
      status: condition.status,
      completionDate: condition.completion_date,
      responsibleName: condition.responsible_name,
      hasDelivery: condition.has_delivery,
      isViolated: condition.is_violated,
    })),
  };
}

function toLicenseRenewed(wire: LicenseRenewedWire): LicenseRenewed {
  return {
    id: wire.id,
    previousLicenseId: wire.previous_license_id,
    status: wire.status,
  };
}

export async function getLicenseHistory(
  licenseId: string
): Promise<LicenseVersion[]> {
  const wire = await request<LicenseHistoryItemWire[]>(
    `/api/licenses/${licenseId}/history`
  );

  return wire.map((item) => ({
    id: item.id,
    processNumber: item.process_number,
    issueDate: item.issue_date,
    expirationDate: item.expiration_date,
    status: item.status,
    isCurrent: item.is_current,
  }));
}

export async function getLicenseDetails(
  customerId: string,
  licenseId: string
): Promise<LicenseDetails> {
  const wire = await request<LicenseDetailsWire>(
    `/api/customers/${customerId}/licenses/${licenseId}`
  );

  return toLicenseDetails(wire);
}

export async function createLicense(
  customerId: string,
  input: CreateLicenseInput
): Promise<License> {
  const formData = new FormData();
  formData.append('type', input.type);
  formData.append('process_number', input.processNumber);
  formData.append('issuing_agency', input.issuingAgency);
  formData.append('issue_date', input.issueDate);
  formData.append('expiration_date', input.expirationDate);
  formData.append('document_file', input.documentFile);

  const wire = await request<LicenseWire>(
    `/api/customers/${customerId}/licenses`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return toLicense(wire);
}

export async function renewLicense(
  licenseId: string,
  input: RenewLicenseInput
): Promise<LicenseRenewed> {
  const formData = new FormData();
  formData.append('process_number', input.processNumber);
  formData.append('issue_date', input.issueDate);
  formData.append('expiration_date', input.expirationDate);
  formData.append('document_file', input.documentFile);
  // Multipart has no nested fields, so the backend expects a JSON string here.
  formData.append(
    'conditions',
    JSON.stringify(input.conditions.map(toRenewalConditionWire))
  );

  const wire = await request<LicenseRenewedWire>(
    `/api/licenses/${licenseId}/renew`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return toLicenseRenewed(wire);
}

/**
 * Asks the backend for a temporary URL to view the license PDF. The bucket is
 * private, so the stored document_url cannot be opened directly.
 */
export async function getLicenseDocumentUrl(
  licenseId: string
): Promise<LicenseDocumentUrl> {
  const wire = await request<LicenseDocumentUrlWire>(
    `/api/licenses/${licenseId}/document/url`
  );

  return { url: wire.document_url, expiresIn: wire.expires_in };
}

function toLicenseExtraction(wire: LicenseExtractionWire): LicenseExtraction {
  const data = wire.extracted_data;

  return {
    extractedData: {
      type: data.type,
      processNumber: data.process_number,
      issuingAgency: data.issuing_agency,
      issueDate: data.issue_date,
      expirationDate: data.expiration_date,
    },
    suggestedConditions: wire.suggested_conditions.map((condition) => ({
      environmentalDescriptor: condition.environmental_descriptor,
      description: condition.description,
      conditionType: condition.condition_type,
      periodicity: condition.periodicity,
      dueDate: condition.due_date,
    })),
  };
}

/* The backend gives the model up to BEDROCK_TIMEOUT_MS (180 s); the margin covers the upload and the last poll. */
const EXTRACTION_POLL_INTERVAL_MS = 3_000;
const EXTRACTION_DEADLINE_MS = 180_000 + 20_000;
const EXTRACTION_ABORTED_MESSAGE = 'Leitura do documento cancelada.';
const EXTRACTION_LOST_MESSAGE =
  'A leitura do documento foi interrompida. Preencha os campos manualmente.';
const EXTRACTION_TIMEOUT_MESSAGE =
  'A leitura do documento demorou mais que o esperado. Preencha os campos manualmente.';
const EXTRACTION_FAILED_MESSAGE =
  'Não foi possível ler o documento automaticamente. Preencha os campos manualmente.';

export interface ExtractLicenseDataOptions {
  /** Stops polling; the server-side job is left to expire on its own. */
  signal?: AbortSignal;
  pollIntervalMs?: number;
  deadlineMs?: number;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiError(0, EXTRACTION_ABORTED_MESSAGE));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new ApiError(0, EXTRACTION_ABORTED_MESSAGE));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Sends the license PDF to be read by the AI and returns suggestions for the
 * registration form. The backend reads it in the background: this uploads the
 * PDF (answered at once with a job id), then polls the job until it is done,
 * so no HTTP request stays open for the length of the model call. Nothing is
 * saved server-side — the license and its conditions are still created through
 * `createLicense` and `createLicenseConditions` once the user has reviewed
 * them.
 *
 * Rejects with an `ApiError` carrying a user-facing message when the job
 * fails, disappears (e.g. the server restarted), is aborted, or outlives the
 * deadline.
 */
export async function extractLicenseData(
  documentFile: File,
  {
    signal,
    pollIntervalMs = EXTRACTION_POLL_INTERVAL_MS,
    deadlineMs = EXTRACTION_DEADLINE_MS,
  }: ExtractLicenseDataOptions = {}
): Promise<LicenseExtraction> {
  const formData = new FormData();
  formData.append('document', documentFile);

  const { job_id: jobId } = await request<StartLicenseExtractionWire>(
    '/api/licenses/extract',
    { method: 'POST', body: formData }
  );
  const giveUpAt = Date.now() + deadlineMs;

  while (Date.now() < giveUpAt) {
    await wait(pollIntervalMs, signal);

    let job: LicenseExtractionJobWire;
    try {
      job = await request<LicenseExtractionJobWire>(
        `/api/licenses/extract/${jobId}`
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError(404, EXTRACTION_LOST_MESSAGE);
      }
      throw error;
    }

    if (signal?.aborted) throw new ApiError(0, EXTRACTION_ABORTED_MESSAGE);
    if (job.status === 'DONE' && job.result) {
      return toLicenseExtraction(job.result);
    }
    if (job.status === 'FAILED') {
      throw new ApiError(422, job.error ?? EXTRACTION_FAILED_MESSAGE);
    }
  }

  throw new ApiError(504, EXTRACTION_TIMEOUT_MESSAGE);
}

function toLicensePanelItem(wire: LicensePanelItemWire): LicensePanelItem {
  return {
    id: wire.id,
    type: wire.type,
    processNumber: wire.process_number,
    issuingAgency: wire.issuing_agency,
    issueDate: wire.issue_date,
    expirationDate: wire.expiration_date,
    status: wire.status,
    documentUrl: wire.document_url,
  };
}

function toLicenseDashboard(wire: LicenseDashboardWire): LicenseDashboard {
  return {
    header: {
      activeLicenses: wire.header.active_licenses,
      pendingItems: wire.header.pending_items,
    },
    counts: wire.counts,
    critical: wire.critical.map((item) => ({
      id: item.id,
      type: item.type,
      processNumber: item.process_number,
      expirationDate: item.expiration_date,
      status: item.status,
    })),
  };
}

export async function getLicenseDashboard(
  customerId: string
): Promise<LicenseDashboard> {
  const wire = await request<LicenseDashboardWire>(
    `/api/customers/${customerId}/dashboard/licenses`
  );

  return toLicenseDashboard(wire);
}

export async function listLicenses(customerId: string): Promise<LicensesPanel> {
  const wire = await request<LicensePanelResponseWire>(
    `/api/customers/${customerId}/licenses`
  );

  return {
    summary: wire.summary,
    licenses: wire.licenses.map(toLicensePanelItem),
  };
}
