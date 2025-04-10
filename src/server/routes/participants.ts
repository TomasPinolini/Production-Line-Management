import { Router, Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface AttributeValue {
  id: number;
  value: string;
}

const router = Router();

// Get all participants
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  console.log('Fetching all participants...');
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT p.*, pt.name as type_name FROM participant p ' +
    'JOIN participant_type pt ON p.type_id = pt.id ' +
    'ORDER BY p.name ASC'
  );
  console.log(`Found ${rows.length} participants`);
  res.json(rows);
}));

// Get a single participant with their attributes
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Fetching participant with ID: ${id}`);

  // Get participant basic info
  const [participants] = await pool.query<RowDataPacket[]>(
    'SELECT p.*, pt.name as type_name FROM participant p ' +
    'JOIN participant_type pt ON p.type_id = pt.id ' +
    'WHERE p.id = ?',
    [id]
  );

  if (!participants[0]) {
    console.log(`Participant with ID ${id} not found`);
    res.status(404).json({ message: 'Participant not found' });
    return;
  }

  const participant = participants[0];

  // Get participant attributes
  const [attributes] = await pool.query<RowDataPacket[]>(
    'SELECT va.*, av.value FROM variable_attribute va ' +
    'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
    'WHERE va.type_id = ?',
    [id, participant.type_id]
  );

  participant.attributes = attributes;
  console.log('Successfully fetched participant with attributes');
  res.json(participant);
}));

// Create a new participant
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, type_id, attributes } = req.body;
  console.log('Creating new participant:', { name, type_id });

  if (!name || !type_id) {
    console.log('Missing required fields');
    res.status(400).json({ message: 'Name and type_id are required' });
    return;
  }

  // Start transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Insert participant
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO participant (name, type_id) VALUES (?, ?)',
      [name, type_id]
    );
    const participantId = result.insertId;

    // Insert attribute values if provided
    if (attributes && attributes.length > 0) {
      const attributeValues = attributes.map((attr: AttributeValue) => [
        participantId,
        attr.id,
        attr.value
      ]);

      await connection.query(
        'INSERT INTO attribute_value (participant_id, attribute_id, value) VALUES ?',
        [attributeValues]
      );
    }

    await connection.commit();
    
    // Fetch the created participant with attributes
    const [newParticipant] = await connection.query<RowDataPacket[]>(
      'SELECT p.*, pt.name as type_name FROM participant p ' +
      'JOIN participant_type pt ON p.type_id = pt.id ' +
      'WHERE p.id = ?',
      [participantId]
    );

    const [newAttributes] = await connection.query<RowDataPacket[]>(
      'SELECT va.*, av.value FROM variable_attribute va ' +
      'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
      'WHERE va.type_id = ?',
      [participantId, type_id]
    );

    newParticipant[0].attributes = newAttributes;
    console.log('Successfully created participant:', newParticipant[0]);
    res.status(201).json(newParticipant[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Update a participant
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type_id, attributes } = req.body;
  console.log(`Updating participant ${id}:`, { name, type_id });

  if (!name || !type_id) {
    console.log('Missing required fields');
    res.status(400).json({ message: 'Name and type_id are required' });
    return;
  }

  // Start transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Update participant
    const [result] = await connection.query<ResultSetHeader>(
      'UPDATE participant SET name = ?, type_id = ? WHERE id = ?',
      [name, type_id, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      console.log(`Participant with ID ${id} not found`);
      res.status(404).json({ message: 'Participant not found' });
      return;
    }

    // Update attribute values
    if (attributes && attributes.length > 0) {
      // Delete existing attribute values
      await connection.query(
        'DELETE FROM attribute_value WHERE participant_id = ?',
        [id]
      );

      // Insert new attribute values
      const attributeValues = attributes.map((attr: AttributeValue) => [
        id,
        attr.id,
        attr.value
      ]);

      await connection.query(
        'INSERT INTO attribute_value (participant_id, attribute_id, value) VALUES ?',
        [attributeValues]
      );
    }

    await connection.commit();

    // Fetch the updated participant with attributes
    const [updatedParticipant] = await connection.query<RowDataPacket[]>(
      'SELECT p.*, pt.name as type_name FROM participant p ' +
      'JOIN participant_type pt ON p.type_id = pt.id ' +
      'WHERE p.id = ?',
      [id]
    );

    const [updatedAttributes] = await connection.query<RowDataPacket[]>(
      'SELECT va.*, av.value FROM variable_attribute va ' +
      'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
      'WHERE va.type_id = ?',
      [id, type_id]
    );

    updatedParticipant[0].attributes = updatedAttributes;
    console.log('Successfully updated participant:', updatedParticipant[0]);
    res.json(updatedParticipant[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Delete a participant
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Deleting participant with ID: ${id}`);

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM participant WHERE id = ?',
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

// Get participants by type
router.get('/type/:typeId', asyncHandler(async (req: Request, res: Response) => {
  const { typeId } = req.params;
  console.log(`Fetching participants for type: ${typeId}`);

  // First get all participants of this type
  const [participants] = await pool.query<RowDataPacket[]>(
    'SELECT p.*, pt.name as type_name FROM participant p ' +
    'JOIN participant_type pt ON p.type_id = pt.id ' +
    'WHERE p.type_id = ? ' +
    'ORDER BY p.name ASC',
    [typeId]
  );

  // Then get all attributes for these participants
  const participantIds = participants.map(p => p.id);
  if (participantIds.length > 0) {
    const [attributes] = await pool.query<RowDataPacket[]>(
      'SELECT va.*, av.value, av.participant_id FROM variable_attribute va ' +
      'LEFT JOIN attribute_value av ON av.attribute_id = va.id ' +
      'WHERE va.type_id = ? AND (av.participant_id IN (?) OR av.participant_id IS NULL)',
      [typeId, participantIds]
    );

    // Group attributes by participant
    const attributesByParticipant: { [key: number]: any[] } = {};
    attributes.forEach(attr => {
      if (attr.participant_id) {
        if (!attributesByParticipant[attr.participant_id]) {
          attributesByParticipant[attr.participant_id] = [];
        }
        attributesByParticipant[attr.participant_id].push({
          id: attr.id,
          name: attr.name,
          value: attr.value,
          format_data: attr.format_data
        });
      }
    });

    // Add attributes to each participant
    participants.forEach(participant => {
      participant.attributes = attributesByParticipant[participant.id] || [];
    });
  }

  console.log(`Found ${participants.length} participants for type ${typeId}`);
  res.json(participants);
}));

export default router; 