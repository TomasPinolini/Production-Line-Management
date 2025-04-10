import { Router, Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all participants
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  console.log('Fetching all participants...');
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant ORDER BY name ASC'
  );
  console.log(`Found ${rows.length} participants`);
  res.json(rows);
}));

// Get a single participant
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Fetching participant with ID: ${id}`);
  
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant WHERE id_P = ?',
    [id]
  );

  if (!rows[0]) {
    console.log(`Participant with ID ${id} not found`);
    res.status(404).json({ message: 'Participant not found' });
    return;
  }

  console.log('Successfully fetched participant:', rows[0]);
  res.json(rows[0]);
}));

// Create a new participant
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, id_Type } = req.body;
  console.log('Creating new participant:', { name, id_Type });

  if (!name || !id_Type) {
    console.log('Missing required fields');
    res.status(400).json({ message: 'Name and participant type ID are required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO participant (name, id_Type) VALUES (?, ?)',
    [name, id_Type]
  );

  const [newParticipant] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant WHERE id_P = ?',
    [result.insertId]
  );

  console.log('Successfully created participant:', newParticipant[0]);
  res.status(201).json(newParticipant[0]);
}));

// Update a participant
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, id_Type } = req.body;
  console.log(`Updating participant ${id}:`, { name, id_Type });

  if (!name || !id_Type) {
    console.log('Missing required fields');
    res.status(400).json({ message: 'Name and participant type ID are required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE participant SET name = ?, id_Type = ? WHERE id_P = ?',
    [name, id_Type, id]
  );

  if (result.affectedRows === 0) {
    console.log(`Participant with ID ${id} not found`);
    res.status(404).json({ message: 'Participant not found' });
    return;
  }

  const [updatedParticipant] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant WHERE id_P = ?',
    [id]
  );

  console.log('Successfully updated participant:', updatedParticipant[0]);
  res.json(updatedParticipant[0]);
}));

// Delete a participant
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Deleting participant with ID: ${id}`);

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM participant WHERE id_P = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    console.log(`Participant with ID ${id} not found`);
    res.status(404).json({ message: 'Participant not found' });
    return;
  }

  console.log(`Successfully deleted participant with ID: ${id}`);
  res.status(204).end();
}));

// Get participant attributes
router.get('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Fetching attributes for participant: ${id}`);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT va.id_VA, va.name, va.formatData, pva.value 
     FROM variable_attribute va
     LEFT JOIN participant_variable_attribute pva ON va.id_VA = pva.id_VA AND pva.id_P = ?
     WHERE va.id_Type = (SELECT id_Type FROM participant WHERE id_P = ?)`,
    [id, id]
  );

  console.log(`Found ${rows.length} attributes`);
  res.json(rows);
}));

// Update participant attributes
router.put('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const attributes = req.body;
  console.log(`Updating attributes for participant ${id}:`, attributes);

  if (!Array.isArray(attributes)) {
    console.log('Invalid attributes format');
    res.status(400).json({ message: 'Attributes must be an array' });
    return;
  }

  // Start a transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Delete existing attributes
    await connection.query(
      'DELETE FROM participant_variable_attribute WHERE id_P = ?',
      [id]
    );

    // Insert new attributes
    for (const attr of attributes) {
      await connection.query(
        'INSERT INTO participant_variable_attribute (id_P, id_VA, value) VALUES (?, ?, ?)',
        [id, attr.id_VA, attr.value]
      );
    }

    await connection.commit();
    console.log(`Successfully updated attributes for participant ${id}`);
    res.json({ message: 'Attributes updated successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Add attribute value to a participant
router.post('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_VA, value } = req.body;
  console.log('Adding attribute value:', { id, id_VA, value });

  if (!id_VA || value === undefined) {
    console.log('Missing required fields');
    res.status(400).json({ message: 'Attribute ID and value are required' });
    return;
  }

  // Get the attribute format data to validate the value
  const [attrRows] = await pool.query<RowDataPacket[]>(
    'SELECT formatData FROM variable_attribute WHERE id_VA = ?',
    [id_VA]
  );

  if (!attrRows.length) {
    console.log(`Attribute with ID ${id_VA} not found`);
    res.status(404).json({ message: 'Attribute not found' });
    return;
  }

  const { formatData } = attrRows[0];
  
  // Validate the value against the format
  try {
    const regex = new RegExp(formatData);
    if (!regex.test(value)) {
      console.log(`Value ${value} does not match format ${formatData}`);
      res.status(400).json({ message: `Value does not match the required format: ${formatData}` });
      return;
    }
  } catch (err) {
    console.error('Error validating format:', err);
    // If the regex is invalid, we'll still allow the value
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO participant_variable_attribute (id_P, id_VA, value) VALUES (?, ?, ?)',
    [id, id_VA, value]
  );

  console.log('Successfully added attribute value');
  res.status(201).json({ id: result.insertId, id_P: id, id_VA, value });
}));

export default router; 