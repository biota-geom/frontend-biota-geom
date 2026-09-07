export type CreateCompanyRequest = {
  name: string;
  document: string;
  document_type: 'cnpj';
  sector_id: string;
  address: {
    type: 'billing';
    state: string;
    city: string;
  };
  responsible_name: string;
  responsible_email: string;
  esg_indicator_ids: string[];
};

export type CreateCompanyFormState = {
  name: string;
  cnpj: string;
  sectorId: string;
  state: string;
  city: string;
  responsibleName: string;
  responsibleEmail: string;
  selectedIndicatorIds: string[];
};
