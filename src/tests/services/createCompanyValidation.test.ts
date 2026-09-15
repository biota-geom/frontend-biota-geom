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
  email: 'contato@unidade.com.br',
  sectorId: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
  street: 'Av. Assis Brasil',
  number: '1234',
  city: 'Porto Alegre',
  state: 'RS',
  postalCode: '91010-000',
  responsibleName: 'Maria Silva',
  responsibleEmail: 'maria@unidade.com.br',
  responsiblePhone: '(51) 99999-0000',
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
      email: COMPANY_MESSAGES.EMAIL_INVALID,
      sectorId: COMPANY_MESSAGES.SECTOR_REQUIRED,
      street: COMPANY_MESSAGES.STREET_REQUIRED,
      number: COMPANY_MESSAGES.NUMBER_REQUIRED,
      city: COMPANY_MESSAGES.CITY_REQUIRED,
      state: COMPANY_MESSAGES.STATE_REQUIRED,
      postalCode: COMPANY_MESSAGES.POSTAL_CODE_REQUIRED,
      responsibleName: COMPANY_MESSAGES.RESPONSIBLE_NAME_REQUIRED,
      responsibleEmail: COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID,
      responsiblePhone: COMPANY_MESSAGES.RESPONSIBLE_PHONE_REQUIRED,
    });
  });

  const SINGLE_FIELD_CASES = [
    { field: 'name', value: '   ', message: COMPANY_MESSAGES.NAME_REQUIRED },
    {
      field: 'cnpj',
      value: '12.345.678/0001-9',
      message: COMPANY_MESSAGES.CNPJ_INVALID,
    },
    {
      field: 'email',
      value: 'sem-arroba',
      message: COMPANY_MESSAGES.EMAIL_INVALID,
    },
    { field: 'sectorId', value: '', message: COMPANY_MESSAGES.SECTOR_REQUIRED },
    {
      field: 'street',
      value: '   ',
      message: COMPANY_MESSAGES.STREET_REQUIRED,
    },
    {
      field: 'number',
      value: '   ',
      message: COMPANY_MESSAGES.NUMBER_REQUIRED,
    },
    { field: 'city', value: '   ', message: COMPANY_MESSAGES.CITY_REQUIRED },
    { field: 'state', value: '   ', message: COMPANY_MESSAGES.STATE_REQUIRED },
    {
      field: 'postalCode',
      value: '   ',
      message: COMPANY_MESSAGES.POSTAL_CODE_REQUIRED,
    },
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
    {
      field: 'responsiblePhone',
      value: '   ',
      message: COMPANY_MESSAGES.RESPONSIBLE_PHONE_REQUIRED,
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
        email: '  contato@unidade.com.br  ',
        street: '  Av. Assis Brasil  ',
        number: '  1234  ',
        city: '  Porto Alegre  ',
        state: '  RS  ',
        postalCode: '  91010-000  ',
        responsibleName: '  Maria Silva  ',
        responsibleEmail: '  maria@unidade.com.br  ',
        responsiblePhone: '  (51) 99999-0000  ',
      })
    ).toEqual({
      name: 'Unidade Industrial RS',
      document: '77666555000144',
      document_type: 'CNPJ',
      sector_id: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
      email: 'contato@unidade.com.br',
      owner_name: 'Maria Silva',
      owner_email: 'maria@unidade.com.br',
      owner_phone: '(51) 99999-0000',
      address: {
        type: 'BILLING',
        street: 'Av. Assis Brasil',
        number: '1234',
        city: 'Porto Alegre',
        state: 'RS',
        postal_code: '91010-000',
        country_code: 'BR',
      },
    });
  });
});
