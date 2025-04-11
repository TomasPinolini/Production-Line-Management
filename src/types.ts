export interface Asset {
  id: number;
  name: string;
  type: string;
  id_parent: number | null;
  created_at?: string;
  updated_at?: string;
  children?: Asset[];
  attributes?: VariableAttribute[];
}

export interface VariableAttribute {
  id: number;
  asset_id: number;
  name: string;
  description?: string;
  format_data?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeValue {
  id: number;
  asset_id: number;
  attribute_id: number;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export interface History {
  id: number;
  asset_id: number;
  attribute_id: number;
  value: string;
  ts: string;
}

export interface ProductionOrder {
  id: number;
  material_number?: string;
  serial_number?: string;
  ts_from?: string;
  ts_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Process {
  id: number;
  order_id: number;
  ts_from?: string;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessStep {
  id: number;
  process_id: number;
  ts_from?: string;
  ts_to?: string;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Step {
  id: number;
  process_step_id: number;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StepParticipant {
  id: number;
  step_id: number;
  participant_id: number;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResultDetail {
  id: number;
  step_id: number;
  update_id: number;
  created_at?: string;
  updated_at?: string;
}

// Helper type for form handling
export interface DynamicFormData {
  participant_name: string;
  attributes: Record<string, string>;
}

// Enums for our known asset types
export enum AssetTypes {
  DEVICE = 'device',
  TOOL = 'tool',
  STATION = 'station'
}

export interface AssetType {
  id: number;
  name: string;
  attributes: VariableAttribute[];
}