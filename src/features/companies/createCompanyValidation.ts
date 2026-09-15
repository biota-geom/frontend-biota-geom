import { unmaskCnpj } from './cnpj';
import { COMPANY_MESSAGES } from './companyMessages';
import type {
  CreateCompanyFieldErrors,
  CreateCompanyFormState,
  CreateCompanyRequest,
} from './createCompany.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CNPJ_LENGTH = 14;

/*
 * country_code is required by the backend but not asked for in the form: every
 * branch registered here is Brazilian, so the field would be a fixed-value
 * control. Revisit if the product ever registers a company abroad.
 */
const DEFAULT_COUNTRY_CODE = 'BR';

export const EMPTY_CREATE_COMPANY_FORM: CreateCompanyFormState = {
  name: '',
  cnpj: '',
  sectorId: '',
  city: '',
  state: '',
  responsibleName: '',
  responsibleEmail: '',
  selectedIndicatorIds: [],
};

/** Returns one message per invalid field; an empty object means the form is submittable. */
export function validateCreateCompany(
  form: CreateCompanyFormState
): CreateCompanyFieldErrors {
  const errors: CreateCompanyFieldErrors = {};

  if (form.name.trim() === '') {
    errors.name = COMPANY_MESSAGES.NAME_REQUIRED;
  }
  if (unmaskCnpj(form.cnpj).length !== CNPJ_LENGTH) {
    errors.cnpj = COMPANY_MESSAGES.CNPJ_INVALID;
  }
  if (form.sectorId === '') {
    errors.sectorId = COMPANY_MESSAGES.SECTOR_REQUIRED;
  }
  if (form.city.trim() === '') {
    errors.city = COMPANY_MESSAGES.CITY_REQUIRED;
  }
  if (form.state.trim() === '') {
    errors.state = COMPANY_MESSAGES.STATE_REQUIRED;
  }
  if (form.responsibleName.trim() === '') {
    errors.responsibleName = COMPANY_MESSAGES.RESPONSIBLE_NAME_REQUIRED;
  }
  if (!EMAIL_PATTERN.test(form.responsibleEmail.trim())) {
    errors.responsibleEmail = COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID;
  }

  return errors;
}

/** Maps the form state onto the exact body POST /customers expects. */
export function buildCreateCompanyRequest(
  form: CreateCompanyFormState
): CreateCompanyRequest {
  return {
    name: form.name.trim(),
    document: unmaskCnpj(form.cnpj),
    document_type: 'CNPJ',
    sector_id: form.sectorId,
    owner_name: form.responsibleName.trim(),
    owner_email: form.responsibleEmail.trim(),
    address: {
      type: 'BILLING',
      city: form.city.trim(),
      state: form.state.trim(),
      country_code: DEFAULT_COUNTRY_CODE,
    },
  };
}
