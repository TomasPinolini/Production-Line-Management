// Base Types
interface Asset {
  id: number;
  name: string;
  type: string;
  id_parent: number | null;
  description?: string;
  children?: Asset[];
  attributes: VariableAttribute[];
  created_at?: string;
  updated_at?: string;
}

interface VariableAttribute {
  id: number;
  name: string;
  description?: string;
  format_data?: string;
  value?: string;
  asset_id: number;
  created_at?: string;
  updated_at?: string;
  source_asset?: string;
  is_inherited?: boolean;
  is_reference?: boolean;
  referenced_asset_id?: number;
}

interface AssetType {
  id: number;
  name: string;
  description?: string;
  attributes?: VariableAttribute[];
  created_at?: string;
  updated_at?: string;
}

interface AssetFormData {
  name: string;
  type: string;
  attributes: {
    id: number;
    value: string;
  }[];
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DynamicFormData {
  participant_name: string;
  attributes: Record<number, string>;
}

// Export all types
export type {
  Asset,
  VariableAttribute,
  AssetType,
  ApiResponse,
  AssetFormData
}; 