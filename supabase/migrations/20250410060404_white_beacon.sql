/*
  # Initial Schema Setup for Screwdriver Management System

  1. New Tables
    - `screwdrivers`
      - `id` (uuid, primary key)
      - `hall` (text) - Building/hall where the screwdriver is located
      - `department` (text) - Department where the screwdriver is used
      - `tool_number` (text) - Unique tool identification number
      - `mac_address` (text) - MAC address of the screwdriver
      - `ip_address` (text) - IP address of the screwdriver
      - `created_at` (timestamp)

    - `screwing_cases`
      - `id` (uuid, primary key)
      - `screwdriver_id` (uuid, foreign key)
      - `description` (text)
      - `target_torque` (numeric) - Target torque value
      - `tolerance_center` (numeric) - Center of tolerance range
      - `lsl` (numeric) - Lower Specification Limit
      - `usl` (numeric) - Upper Specification Limit
      - `tolerance_percentage` (numeric) - Tolerance percentage
      - `departments` (text[]) - Array of departments
      - `workstation` (text) - Workstation identifier
      - `comments` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and write data
*/

-- Create screwdrivers table
CREATE TABLE IF NOT EXISTS screwdrivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall text NOT NULL,
  department text NOT NULL,
  tool_number text NOT NULL UNIQUE,
  mac_address text NOT NULL UNIQUE,
  ip_address text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create screwing_cases table
CREATE TABLE IF NOT EXISTS screwing_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screwdriver_id uuid REFERENCES screwdrivers(id) ON DELETE CASCADE,
  description text NOT NULL,
  target_torque numeric NOT NULL,
  tolerance_center numeric NOT NULL,
  lsl numeric NOT NULL,
  usl numeric NOT NULL,
  tolerance_percentage numeric NOT NULL,
  departments text[] NOT NULL,
  workstation text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE screwdrivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE screwing_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for screwdrivers
CREATE POLICY "Allow authenticated users to read screwdrivers"
  ON screwdrivers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert screwdrivers"
  ON screwdrivers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for screwing_cases
CREATE POLICY "Allow authenticated users to read screwing cases"
  ON screwing_cases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert screwing cases"
  ON screwing_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);