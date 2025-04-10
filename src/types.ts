export interface ParticipantType {
  id_PT: number;
  name: string;
  attributes?: VariableAttribute[];
}

export interface Participant {
  id_Participant: number;
  name: string;
  id_Type: number;
  attributes?: ParticipantAttribute[];
}

export interface VariableAttribute {
  id_VA: number;
  id_Type: number;
  name: string;
  formatData: string;
}

export interface ParticipantAttribute {
  id_U: number;
  id_Participant: number;
  id_Attribute: number;
  value: string;
  ts?: string;
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