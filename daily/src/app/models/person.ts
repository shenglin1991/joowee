export type PersonStatus = 'active' | 'absent';

export interface Person {
  id: string;
  name: string;
  status: PersonStatus;
}
