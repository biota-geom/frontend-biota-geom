export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  segment: string;
  location: string;
}

export type CompanyDetail = {
  id: string;
  name: string;
  document: string;
  documentType: string;
  status: 'active' | 'inactive';
  sector: {
    id: string;
    name: string;
  };
  address: {
    city: string;
    state: string;
  };
};

export type CompanyWire = {
  id: string;
  name: string;
  document: string;
  document_type: string;
  status: 'active' | 'inactive';
  sector: {
    id: string;
    name: string;
  };
  address: {
    city: string;
    state: string;
  };
};
