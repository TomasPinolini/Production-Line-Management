import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all participants of a specific type
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { typeId } = req.query;
    
    if (!typeId) {
      res.status(400).json({ error: 'Type ID is required' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_Participant, name, id_Type FROM participant WHERE id_Type = ?',
      [typeId]
    );

    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
}));

// Get a single participant
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_Participant, name, id_Type FROM participant WHERE id_Participant = ?',
      [req.params.id]
    );

    if (!rows[0]) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching participant:', error);
    res.status(500).json({ error: 'Failed to fetch participant' });
  }
}));

// Get participant's attribute values
router.get('/:id/attributes', asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id_U, u.id_Participant, u.id_Attribute, u.value, u.ts
       FROM \`update\` u
       WHERE u.id_Participant = ?
       AND u.id_U IN (
         SELECT MAX(id_U)
         FROM \`update\`
         WHERE id_Participant = ?
         GROUP BY id_Attribute
       )`,
      [req.params.id, req.params.id]
    );

    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching participant attributes:', error);
    res.status(500).json({ error: 'Failed to fetch participant attributes' });
  }
}));

// Create a new participant
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { name, typeId, attributes } = req.body;

    if (!name || !typeId) {
      res.status(400).json({ error: 'Name and type ID are required' });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert the participant
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO participant (name, id_Type) VALUES (?, ?)',
        [name, typeId]
      );

      const participantId = result.insertId;

      // Insert attribute values
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeValues = Object.entries(attributes).map(([attributeId, value]) => [
          participantId,
          attributeId,
          value
        ]);

        await connection.query(
          'INSERT INTO `update` (id_Participant, id_Attribute, value) VALUES ?',
          [attributeValues]
        );
      }

      await connection.commit();

      const [participant] = await connection.query<RowDataPacket[]>(
        'SELECT id_Participant, name, id_Type FROM participant WHERE id_Participant = ?',
        [participantId]
      );

      res.status(201).json(participant[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error creating participant:', error);
    res.status(500).json({ error: 'Failed to create participant' });
  }
}));

// Update a participant
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const { name, attributes } = req.body;
    const participantId = req.params.id;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update participant name
      await connection.query(
        'UPDATE participant SET name = ? WHERE id_Participant = ?',
        [name, participantId]
      );

      // Update attribute values
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeValues = Object.entries(attributes).map(([attributeId, value]) => [
          participantId,
          attributeId,
          value
        ]);

        await connection.query(
          'INSERT INTO `update` (id_Participant, id_Attribute, value) VALUES ?',
          [attributeValues]
        );
      }

      await connection.commit();

      const [participant] = await connection.query<RowDataPacket[]>(
        'SELECT id_Participant, name, id_Type FROM participant WHERE id_Participant = ?',
        [participantId]
      );

      res.json(participant[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error updating participant:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
}));

// Delete a participant
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM participant WHERE id_Participant = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
}));

export default router; 