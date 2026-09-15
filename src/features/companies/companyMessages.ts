/*
 * Centralized PT-BR copy for the company registration flow. The backend
 * already answers in PT-BR for the cases this form can hit (409 on a
 * duplicate CNPJ, 422 on an unknown sector) and those messages are rendered
 * verbatim — these constants only cover client-side validation, the loading
 * failures the UI owns, and the fallback when an error carries no message.
 */
export const COMPANY_MESSAGES = {
  NAME_REQUIRED: 'Informe o nome da empresa.',
  CNPJ_INVALID: 'Informe um CNPJ válido, com 14 dígitos.',
  EMAIL_INVALID: 'Informe um e-mail válido para a empresa.',
  SECTOR_REQUIRED: 'Selecione o segmento da empresa.',
  STREET_REQUIRED: 'Informe o logradouro.',
  NUMBER_REQUIRED: 'Informe o número.',
  CITY_REQUIRED: 'Informe a cidade.',
  STATE_REQUIRED: 'Informe o estado.',
  POSTAL_CODE_REQUIRED: 'Informe o CEP.',
  RESPONSIBLE_NAME_REQUIRED: 'Informe o nome do responsável.',
  RESPONSIBLE_EMAIL_INVALID: 'Informe um e-mail válido para o responsável.',
  RESPONSIBLE_PHONE_REQUIRED: 'Informe o telefone do responsável.',
  SECTORS_FETCH_ERROR:
    'Não foi possível carregar os segmentos. Feche e abra o cadastro para tentar novamente.',
  INDICATORS_FETCH_ERROR: 'Não foi possível carregar os indicadores ESG.',
  CREATE_INDICATOR_ERROR: 'Não foi possível criar o indicador.',
  CREATE_COMPANY_ERROR:
    'Não foi possível cadastrar a empresa. Tente novamente mais tarde.',
  CREATED_WITHOUT_ESG_METRICS:
    'Empresa cadastrada, mas não foi possível vincular os indicadores ESG selecionados.',
} as const;
