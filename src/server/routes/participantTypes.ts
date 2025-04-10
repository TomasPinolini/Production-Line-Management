import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all participant types
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type ORDER BY name ASC'
  );
  res.json(rows);
}));

// Get a single participant type
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type WHERE id = ?',
    [req.params.id]
  );
  
  if (!rows[0]) {
    res.status(404).json({ message: 'Participant type not found' });
    return;
  }
  
  res.json(rows[0]);
}));

// Create a new participant type
router.post('/', asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
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

  res.status(201).json(newType[0]);
}));

// Update a participant type
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE participant_type SET name = ?, description = ? WHERE id = ?',
    [name, description, req.params.id]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Participant type not found' });
    return;
  }

  const [updatedType] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_type WHERE id = ?',
    [req.params.id]
  );

  res.json(updatedType[0]);
}));

// Delete a participant type
router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM participant_type WHERE id = ?',
    [req.params.id]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Participant type not found' });
    return;
  }

  res.status(204).end();
}));

export default router; 