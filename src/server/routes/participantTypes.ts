import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all participant types
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('Attempting to fetch participant types...');
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_PT as id, name FROM participant_type ORDER BY name ASC'
    );
    console.log('Successfully fetched participant types:', rows);
    res.json(rows);
  } catch (error: any) {
    console.error('Error in GET /participant-types:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}));

// Get a single participant type
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    console.log(`Attempting to fetch participant type with id: ${req.params.id}`);
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM participant_type WHERE id_PT = ?',
      [req.params.id]
    );
    
    if (!rows[0]) {
      console.log(`Participant type with id ${req.params.id} not found`);
      res.status(404).json({ message: 'Participant type not found' });
      return;
    }
    
    console.log('Successfully fetched participant type:', rows[0]);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error in GET /participant-types/:id:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}));

// Create a new participant type
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Attempting to create participant type with name:', name);
    
    if (!name) {
      console.log('Name is required but not provided');
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO participant_type (name) VALUES (?)',
      [name]
    );

    const [newType] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM participant_type WHERE id_PT = ?',
      [result.insertId]
    );

    console.log('Successfully created participant type:', newType[0]);
    res.status(201).json(newType[0]);
  } catch (error: any) {
    console.error('Error in POST /participant-types:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}));

// Update a participant type
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    console.log(`Attempting to update participant type with id: ${req.params.id}`);
    
    if (!name) {
      console.log('Name is required but not provided');
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE participant_type SET name = ? WHERE id_PT = ?',
      [name, req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log(`Participant type with id ${req.params.id} not found for update`);
      res.status(404).json({ message: 'Participant type not found' });
      return;
    }

    const [updatedType] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM participant_type WHERE id_PT = ?',
      [req.params.id]
    );

    console.log('Successfully updated participant type:', updatedType[0]);
    res.json(updatedType[0]);
  } catch (error: any) {
    console.error('Error in PUT /participant-types/:id:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}));

// Delete a participant type
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    console.log(`Attempting to delete participant type with id: ${req.params.id}`);
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM participant_type WHERE id_PT = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log(`Participant type with id ${req.params.id} not found for deletion`);
      res.status(404).json({ message: 'Participant type not found' });
      return;
    }

    console.log(`Successfully deleted participant type with id: ${req.params.id}`);
    res.status(204).end();
  } catch (error: any) {
    console.error('Error in DELETE /participant-types/:id:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}));

// Get attributes for a participant type
router.get('/:id/attributes', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching attributes for participant type:', id);

    // First verify the participant type exists
    const [typeRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM participant_type WHERE id_PT = ?',
      [id]
    );

    if (!typeRows.length) {
      console.log(`Participant type ${id} not found`);
      res.status(404).json({ error: 'Participant type not found' });
      return;
    }

    // Get the attributes
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_VA as id, name, id_Type as participant_type_id, formatData FROM variable_attribute WHERE id_Type = ?',
      [id]
    );

    console.log(`Found ${rows.length} attributes for participant type ${id}`);
    // Return empty array if no attributes found (not an error)
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ error: 'Failed to fetch attributes' });
  }
}));

// Add a new attribute to a participant type
router.post('/:id/attributes', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, formatData, description } = req.body;
    
    console.log('Adding attribute:', { id, name, formatData, description });

    // Verify the participant type exists first
    const [typeRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM participant_type WHERE id_PT = ?',
      [id]
    );

    if (!typeRows.length) {
      console.error(`Participant type with ID ${id} not found`);
      res.status(404).json({ error: 'Participant type not found' });
      return;
    }

    // Ensure formatData length is within VARCHAR(100) limit
    const truncatedFormat = formatData?.substring(0, 100) || '';
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO variable_attribute (id_Type, name, formatData) VALUES (?, ?, ?)',
      [parseInt(id), name, truncatedFormat]
    );
    
    const newAttribute = {
      id: result.insertId,
      participant_type_id: parseInt(id),
      name,
      formatData: truncatedFormat
    };

    console.log('Successfully added attribute:', newAttribute);
    res.status(201).json(newAttribute);
  } catch (error: any) {
    console.error('Error adding attribute:', error);
    // Send more detailed error information
    res.status(500).json({ 
      error: 'Failed to add attribute',
      details: error.message || 'Unknown error',
      sqlMessage: error.sqlMessage
    });
  }
}));

// Delete an attribute
router.delete('/:id/attributes/:attributeId', asyncHandler(async (req, res) => {
  try {
    const { attributeId } = req.params;
    await pool.query('DELETE FROM variable_attribute WHERE id_VA = ?', [attributeId]);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ error: 'Failed to delete attribute' });
  }
}));

// Update an attribute
router.put('/:id/attributes/:attributeId', asyncHandler(async (req, res) => {
  try {
    const { attributeId } = req.params;
    const { name, formatData } = req.body;
    
    console.log('Updating attribute:', { attributeId, name, formatData });

    // Ensure formatData length is within VARCHAR(100) limit
    const truncatedFormat = formatData?.substring(0, 100) || '';

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE variable_attribute SET name = ?, formatData = ? WHERE id_VA = ?',
      [name, truncatedFormat, attributeId]
    );

    if (result.affectedRows === 0) {
      console.log(`Attribute with id ${attributeId} not found`);
      res.status(404).json({ error: 'Attribute not found' });
      return;
    }

    const [updatedAttribute] = await pool.query<RowDataPacket[]>(
      'SELECT id_VA as id, name, id_Type as participant_type_id, formatData FROM variable_attribute WHERE id_VA = ?',
      [attributeId]
    );

    console.log('Successfully updated attribute:', updatedAttribute[0]);
    res.json(updatedAttribute[0]);
  } catch (error: any) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ 
      error: 'Failed to update attribute',
      details: error.message || 'Unknown error',
      sqlMessage: error.sqlMessage
    });
  }
}));

export default router; 