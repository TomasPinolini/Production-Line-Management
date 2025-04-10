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
      'SELECT * FROM participant_type ORDER BY name ASC'
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

export default router; 