export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  segment: string;
  location: string;
}
