export interface ParticipantType {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  attributes?: VariableAttribute[];
}

export interface Participant {
  id: number;
  name: string;
  type_id: number;
  created_at?: string;
  updated_at?: string;
  attributes?: ParticipantAttribute[];
}

export interface VariableAttribute {
  id: number;
  type_id: number;
  name: string;
  description?: string;
  format_data?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParticipantAttribute {
  id: number;
  participant_id: number;
  attribute_id: number;
  value: string;
  created_at?: string;
  updated_at?: string;
}

// Helper type for form handling
export interface DynamicFormData {
  participant_name: string;
  attributes: Record<string, string>;
}

// Enums for our known participant types
export enum ParticipantTypes {
  Device = 1,
  Program = 2,
}