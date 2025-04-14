// Base Types
interface Asset {
  id: number;
  name: string;
  type: string;
  id_parent: number | null;
  created_at?: string;
  updated_at?: string;
  children?: Asset[];
  attributes?: VariableAttribute[];
}

interface VariableAttribute {
  id: number;
  name: string;
  description?: string;
  format_data?: string;
  value?: string;
  asset_id?: number;
  participant_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface Participant {
  id: number;
  name: string;
  type: string;
  id_parent: number | null;
  id_PT?: number;  // Participant Type ID
  description?: string;
  children?: Participant[];
  attributes: VariableAttribute[];
  created_at?: string;
  updated_at?: string;
}

interface ParticipantType {
  id: number;
  id_PT?: number;  // Some responses use id_PT instead of id
  name: string;
  description?: string;
  attributes?: VariableAttribute[];
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

interface ParticipantFormData {
  name: string;
  attributes: {
    id: number;
    value: string;
  }[];
}

// Production Core Types
interface ProductionOrder {
  id: number;
  material_number?: string;
  serial_number?: string;
  ts_from?: string;
  ts_to?: string;
  created_at?: string;
  updated_at?: string;
}

interface Process {
  id: number;
  order_id: number;
  ts_from?: string;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProcessStep {
  id: number;
  process_id: number;
  ts_from?: string;
  ts_to?: string;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

interface Step {
  id: number;
  process_step_id: number;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

interface StepParticipant {
  id: number;
  step_id: number;
  participant_id: number;
  result?: string;
  created_at?: string;
  updated_at?: string;
}

interface ResultDetail {
  id: number;
  step_id: number;
  update_id: number;
  created_at?: string;
  updated_at?: string;
}

// Helper types
interface DynamicFormData {
  participant_name: string;
  attributes: Record<string, string>;
}

enum AssetTypes {
  DEVICE = 'device',
  TOOL = 'tool',
  STATION = 'station'
}

interface AssetType {
  id: number;
  name: string;
  attributes: VariableAttribute[];
}

// Export all types
export type {
  Asset,
  VariableAttribute,
  Participant,
  ParticipantType,
  ApiResponse,
  ParticipantFormData,
  ProductionOrder,
  Process,
  ProcessStep,
  Step,
  StepParticipant,
  ResultDetail,
  DynamicFormData,
  AssetType
};

export { AssetTypes }; 