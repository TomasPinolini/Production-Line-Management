import { Router, Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all participant types
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  console.log('Fetching all participant types...');
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type ORDER BY name ASC'
  );
  console.log(`Found ${rows.length} participant types`);
  res.json(rows);
}));

// Get a single participant type
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Fetching participant type with ID: ${id}`);
  
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type WHERE id = ?',
    [id]
  );

  if (!rows[0]) {
    console.log(`Participant type with ID ${id} not found`);
    res.status(404).json({ message: 'Participant type not found' });
    return;
  }

  console.log('Successfully fetched participant type:', rows[0]);
  res.json(rows[0]);
}));

// Create a new participant type
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  console.log('Creating new participant type:', { name, description });

  if (!name) {
    console.log('Missing required field: name');
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO participant_type (name, description) VALUES (?, ?)',
    [name, description]
  );

  const [newType] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type WHERE id = ?',
    [result.insertId]
  );

  console.log('Successfully created participant type:', newType[0]);
  res.status(201).json(newType[0]);
}));

// Update a participant type
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  console.log(`Updating participant type ${id}:`, { name, description });

  if (!name) {
    console.log('Missing required field: name');
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE participant_type SET name = ?, description = ? WHERE id = ?',
    [name, description, id]
  );

  if (result.affectedRows === 0) {
    console.log(`Participant type with ID ${id} not found`);
    res.status(404).json({ message: 'Participant type not found' });
    return;
  }

  const [updatedType] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type WHERE id = ?',
    [id]
  );

  console.log('Successfully updated participant type:', updatedType[0]);
  res.json(updatedType[0]);
}));

// Delete a participant type
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Deleting participant type with ID: ${id}`);

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM participant_type WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    console.log(`Participant type with ID ${id} not found`);
    res.status(404).json({ message: 'Participant type not found' });
    return;
  }

  console.log(`Successfully deleted participant type with ID: ${id}`);
  res.status(204).end();
}));

// Get attributes for a participant type
router.get('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Fetching attributes for participant type: ${id}`);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM variable_attribute WHERE type_id = ? ORDER BY name ASC',
    [id]
  );

  console.log(`Found ${rows.length} attributes for type ${id}`);
  res.json(rows);
}));

// Add a new attribute to a participant type
router.post('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, format_data, description } = req.body;
  
  console.log('Adding attribute:', { id, name, format_data, description });

  // Verify the participant type exists first
  const [typeRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type WHERE id = ?',
    [id]
  );

  if (!typeRows.length) {
    console.error(`Participant type with ID ${id} not found`);
    res.status(404).json({ error: 'Participant type not found' });
    return;
  }

  // Ensure format_data length is within VARCHAR(100) limit
  const truncatedFormat = format_data?.substring(0, 100) || '';
  
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO variable_attribute (type_id, name, format_data, description) VALUES (?, ?, ?, ?)',
    [parseInt(id), name, truncatedFormat, description || null]
  );
  
  const [newAttribute] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, type_id, format_data, description FROM variable_attribute WHERE id = ?',
    [result.insertId]
  );

  console.log('Successfully added attribute:', newAttribute[0]);
  res.status(201).json(newAttribute[0]);
}));

// Delete an attribute
router.delete('/:id/attributes/:attributeId', asyncHandler(async (req: Request, res: Response) => {
  const { attributeId } = req.params;
  await pool.query('DELETE FROM variable_attribute WHERE id = ?', [attributeId]);
  res.status(204).send();
}));

// Update an attribute
router.put('/:id/attributes/:attributeId', asyncHandler(async (req: Request, res: Response) => {
  const { attributeId } = req.params;
  const { name, format_data, description } = req.body;
  
  console.log('Updating attribute:', { attributeId, name, format_data, description });

  // Ensure format_data length is within VARCHAR(100) limit
  const truncatedFormat = format_data?.substring(0, 100) || '';

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE variable_attribute SET name = ?, format_data = ?, description = ? WHERE id = ?',
    [name, truncatedFormat, description || null, attributeId]
  );

  if (result.affectedRows === 0) {
    console.log(`Attribute with id ${attributeId} not found`);
    res.status(404).json({ error: 'Attribute not found' });
    return;
  }

  const [updatedAttribute] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, type_id, format_data, description FROM variable_attribute WHERE id = ?',
    [attributeId]
  );

  console.log('Successfully updated attribute:', updatedAttribute[0]);
  res.json(updatedAttribute[0]);
}));

export default router; 