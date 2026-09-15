import { describe, expect, it } from 'vitest';
import { COMPANY_MESSAGES } from '../../features/companies/companyMessages';
import type { CreateCompanyFormState } from '../../features/companies/createCompany.types';
import {
  EMPTY_CREATE_COMPANY_FORM,
  buildCreateCompanyRequest,
  validateCreateCompany,
} from '../../features/companies/createCompanyValidation';

const VALID_FORM: CreateCompanyFormState = {
  name: 'Unidade Industrial RS',
  cnpj: '77.666.555/0001-44',
  sectorId: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
  city: 'Porto Alegre',
  state: 'RS',
  responsibleName: 'Maria Silva',
  responsibleEmail: 'maria@unidade.com.br',
  selectedIndicatorIds: ['metric-1'],
};

describe('validateCreateCompany', () => {
  it('accepts a fully filled form', () => {
    expect(validateCreateCompany(VALID_FORM)).toEqual({});
  });

  it('reports every required field on an empty form', () => {
    expect(validateCreateCompany(EMPTY_CREATE_COMPANY_FORM)).toEqual({
      name: COMPANY_MESSAGES.NAME_REQUIRED,
      cnpj: COMPANY_MESSAGES.CNPJ_INVALID,
      sectorId: COMPANY_MESSAGES.SECTOR_REQUIRED,
      city: COMPANY_MESSAGES.CITY_REQUIRED,
      state: COMPANY_MESSAGES.STATE_REQUIRED,
      responsibleName: COMPANY_MESSAGES.RESPONSIBLE_NAME_REQUIRED,
      responsibleEmail: COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID,
    });
  });

  const SINGLE_FIELD_CASES = [
    { field: 'name', value: '   ', message: COMPANY_MESSAGES.NAME_REQUIRED },
    {
      field: 'cnpj',
      value: '12.345.678/0001-9',
      message: COMPANY_MESSAGES.CNPJ_INVALID,
    },
    { field: 'sectorId', value: '', message: COMPANY_MESSAGES.SECTOR_REQUIRED },
    { field: 'city', value: '   ', message: COMPANY_MESSAGES.CITY_REQUIRED },
    { field: 'state', value: '   ', message: COMPANY_MESSAGES.STATE_REQUIRED },
    {
      field: 'responsibleName',
      value: '   ',
      message: COMPANY_MESSAGES.RESPONSIBLE_NAME_REQUIRED,
    },
    {
      field: 'responsibleEmail',
      value: 'maria@empresa',
      message: COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID,
    },
  ] as const;

  it.each(SINGLE_FIELD_CASES)(
    'rejects "$field" on its own and leaves the other fields valid',
    ({ field, value, message }) => {
      const errors = validateCreateCompany({ ...VALID_FORM, [field]: value });

      expect(errors).toEqual({ [field]: message });
    }
  );
});

describe('buildCreateCompanyRequest', () => {
  it('maps the form onto the CreateCustomerDto shape, trimming and unmasking', () => {
    expect(
      buildCreateCompanyRequest({
        ...VALID_FORM,
        name: '  Unidade Industrial RS  ',
        city: '  Porto Alegre  ',
        state: '  RS  ',
        responsibleName: '  Maria Silva  ',
        responsibleEmail: '  maria@unidade.com.br  ',
      })
    ).toEqual({
      name: 'Unidade Industrial RS',
      document: '77666555000144',
      document_type: 'CNPJ',
      sector_id: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
      owner_name: 'Maria Silva',
      owner_email: 'maria@unidade.com.br',
      address: {
        type: 'BILLING',
        city: 'Porto Alegre',
        state: 'RS',
        country_code: 'BR',
      },
    });
  });

  /*
   * The company's own e-mail and phone, and the street-level address, are
   * optional on the backend precisely because this form does not ask for them.
   * Sending them as empty strings would satisfy the type but store blanks, so
   * the payload must leave the keys out entirely.
   */
  it('omits the keys the form does not collect', () => {
    const request = buildCreateCompanyRequest(VALID_FORM);

    expect(request).not.toHaveProperty('email');
    expect(request).not.toHaveProperty('owner_phone');
    expect(request.address).not.toHaveProperty('street');
    expect(request.address).not.toHaveProperty('number');
    expect(request.address).not.toHaveProperty('postal_code');
  });
});
