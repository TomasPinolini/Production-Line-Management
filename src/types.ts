export interface ParticipantType {
  id_PT: number;
  name: string;
}

export interface Participant {
  id_Participant: number;
  name: string;
  id_Type: number;
  attributes: Record<string, string>;
  created_at: string;
}

export interface VariableAttribute {
  id: number;
  name: string;
  type_id: number;
  formatData: string;
}

export interface AttributeValue {
  participant_id: number;
  attribute_id: number;
  value: string;
  timestamp: string;
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