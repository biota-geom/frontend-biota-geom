/*
 * Mirrors the backend's CreateCustomerDto field by field: snake_case keys,
 * UPPERCASE enum members (DocumentType / AddressType) and every field
 * required (@IsNotEmpty). This is the body POST /customers receives as-is,
 * so it is the one place the contract is written down on the frontend.
 */
export type CreateCompanyAddress = {
  /** BILLING | SHIPPING on the backend; the registration form only files a billing address. */
  type: 'BILLING';
  street: string;
  number: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
};

export type CreateCompanyRequest = {
  name: string;
  /** Sent masked; the backend strips it down to digits before persisting. */
  document: string;
  /** CPF | CNPJ on the backend; this flow registers legal entities only. */
  document_type: 'CNPJ';
  sector_id: string;
  email: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  address: CreateCompanyAddress;
};

/** What the UI needs back from POST /customers — the id links the ESG metrics. */
export type CreatedCompany = {
  id: string;
  name: string;
};

/*
 * ESG metrics are not part of CreateCustomerDto: they are linked by a second
 * call to POST /customers/:id/esg-metrics, so the modal hands both halves over
 * together and the page sequences the two requests.
 */
export type CreateCompanySubmission = {
  company: CreateCompanyRequest;
  esgMetricIds: string[];
};

export type CreateCompanyFormState = {
  name: string;
  cnpj: string;
  email: string;
  sectorId: string;
  street: string;
  number: string;
  city: string;
  state: string;
  postalCode: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  selectedIndicatorIds: string[];
};

export type CreateCompanyField = Exclude<
  keyof CreateCompanyFormState,
  'selectedIndicatorIds'
>;

export type CreateCompanyFieldErrors = Partial<
  Record<CreateCompanyField, string>
>;
