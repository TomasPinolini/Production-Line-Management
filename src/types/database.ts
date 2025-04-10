// Production Core
export interface ProductionOrder {
  id: number;
  material_number: string;
  serial_number: string;
  created_at: Date;
  updated_at: Date;
}

export interface Process {
  id: number;
  production_order_id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessStep {
  id: number;
  process_id: number;
  step_id: number;
  order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Step {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Flexible Participant System
export interface ParticipantType {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Participant {
  id: number;
  participant_type_id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VariableAttribute {
  id: number;
  participant_type_id: number;
  name: string;
  description?: string;
  validation_pattern?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Update {
  id: number;
  participant_id: number;
  variable_attribute_id: number;
  value: string;
  created_at: Date;
}

// Linking System
export interface StepParticipant {
  id: number;
  step_id: number;
  participant_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ResultDetails {
  id: number;
  step_participant_id: number;
  result: string;
  created_at: Date;
  updated_at: Date;
} 