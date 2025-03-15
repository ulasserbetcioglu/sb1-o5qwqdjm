export interface Application {
  id: string;
  application_code: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes?: string;
  service_types: string[] | string;
  customer?: {
    name: string;
  };
  branch?: {
    name: string;
  };
  operator?: {
    name: string;
  };
}