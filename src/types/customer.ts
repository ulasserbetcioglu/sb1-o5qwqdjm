import { Database } from './supabase';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  company_id: string;
  branch_count: number;
  customer_code: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type CustomerError = {
  message: string;
  field?: keyof CustomerFormData;
} | null;