export interface MechanicalCreate {
  municipality_id: number;
  cellphone_number: string;
  name: string;
  email: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_link?: string | null;
}
