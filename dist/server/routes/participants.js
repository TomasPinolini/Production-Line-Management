"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
// Get all root participants (those with null parent)
router.get('/roots', (0, asyncHandler_1.default)(async (req, res) => {
    console.log('Fetching all root participants...');
    const connection = await db_js_1.default.getConnection();
    try {
        // First get all root participants
        const [rootParticipants] = await connection.query('SELECT * FROM participant WHERE id_parent IS NULL ORDER BY name ASC');
        // For each root participant, fetch their complete hierarchy
        const rootsWithHierarchy = await Promise.all(rootParticipants.map(async (root) => {
            // Get all descendants using recursive CTE
            const [descendants] = await connection.query(`WITH RECURSIVE participant_hierarchy AS (
            -- Base case: direct children of the current root
            SELECT 
              p.*,
              1 as level,
              CAST(p.id AS CHAR(200)) as path
            FROM participant p
            WHERE p.id_parent = ?
            
            UNION ALL
            
            -- Recursive case: children of children
            SELECT 
              p.*,
              ph.level + 1,
              CONCAT(ph.path, ',', p.id)
            FROM participant p
            INNER JOIN participant_hierarchy ph ON p.id_parent = ph.id
          )
          SELECT * FROM participant_hierarchy
          ORDER BY path`, [root.id]);
            // Build the hierarchy tree
            const buildHierarchy = (participants, parentId = null) => {
                return participants
                    .filter(p => p.id_parent === parentId)
                    .map(p => ({
                    ...p,
                    children: buildHierarchy(participants, p.id)
                }));
            };
            // Return root with its hierarchy
            return {
                ...root,
                children: buildHierarchy(descendants, root.id)
            };
        }));
        console.log(`Found ${rootsWithHierarchy.length} root participants with their complete hierarchies`);
        res.json(rootsWithHierarchy);
    }
    finally {
        connection.release();
    }
}));
// Get a participant with its children and attributes
router.get('/:id', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching participant with ID: ${id}`);
    const connection = await db_js_1.default.getConnection();
    try {
        // Get participant basic info
        const [participants] = await connection.query('SELECT * FROM participant WHERE id = ?', [id]);
        if (!participants[0]) {
            console.log(`Participant with ID ${id} not found`);
            res.status(404).json({ message: 'Participant not found' });
            return;
        }
        const participant = participants[0];
        // Get participant's attributes
        const [attributes] = await connection.query('SELECT va.*, av.value FROM variable_attribute va ' +
            'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
            'WHERE va.participant_id = ?', [id, id]);
        // Get participant's children
        const [children] = await connection.query('SELECT * FROM participant WHERE id_parent = ?', [id]);
        // Get inherited attributes from parent chain
        const [inheritedAttributes] = await connection.query(`WITH RECURSIVE parent_chain AS (
        SELECT id, id_parent FROM participant WHERE id = ?
        UNION ALL
        SELECT p.id, p.id_parent FROM participant p
        INNER JOIN parent_chain pc ON p.id = pc.id_parent
      )
      SELECT DISTINCT va.*, av.value 
      FROM parent_chain pc
      JOIN variable_attribute va ON va.participant_id = pc.id
      LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ?
      WHERE pc.id != ?`, [id, id, id]);
        participant.attributes = [...attributes, ...inheritedAttributes];
        participant.children = children;
        console.log('Successfully fetched participant with attributes and children');
        res.json(participant);
    }
    finally {
        connection.release();
    }
}));
// Get children of a participant
router.get('/:id/children', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching children of participant: ${id}`);
    const [rows] = await db_js_1.default.query(`SELECT p.*, 
            (SELECT COUNT(*) FROM participant WHERE id_parent = p.id) > 0 as has_children
     FROM participant p 
     WHERE p.id_parent = ? 
     ORDER BY p.name ASC`, [id]);
    console.log(`Found ${rows.length} children`);
    res.json(rows);
}));
// Get inherited attributes for a participant
router.get('/:id/inherited-attributes', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching inherited attributes for participant: ${id}`);
    const [rows] = await db_js_1.default.query(`WITH RECURSIVE parent_chain AS (
      SELECT id, id_parent FROM participant WHERE id = ?
      UNION ALL
      SELECT p.id, p.id_parent FROM participant p
      INNER JOIN parent_chain pc ON p.id = pc.id_parent
    )
    SELECT DISTINCT va.*, av.value 
    FROM parent_chain pc
    JOIN variable_attribute va ON va.participant_id = pc.id
    LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ?
    WHERE pc.id != ?`, [id, id, id]);
    console.log(`Found ${rows.length} inherited attributes`);
    res.json(rows);
}));
// Get participant's own attributes
router.get('/:id/attributes', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching own attributes for participant: ${id}`);
    const [rows] = await db_js_1.default.query('SELECT va.*, av.value FROM variable_attribute va ' +
        'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
        'WHERE va.participant_id = ?', [id, id]);
    console.log(`Found ${rows.length} own attributes`);
    res.json(rows);
}));
// Create a new participant
router.post('/', (0, asyncHandler_1.default)(async (req, res) => {
    const { name, id_parent, attributes } = req.body;
    console.log('Creating new participant:', { name, id_parent });
    if (!name) {
        console.log('Missing required fields');
        res.status(400).json({ message: 'Name is required' });
        return;
    }
    const connection = await db_js_1.default.getConnection();
    await connection.beginTransaction();
    try {
        // Validate parent if provided
        if (id_parent) {
            const [parentRows] = await connection.query('SELECT id FROM participant WHERE id = ?', [id_parent]);
            if (!parentRows[0]) {
                throw new Error('Parent participant not found');
            }
        }
        // Insert participant
        const [result] = await connection.query('INSERT INTO participant (name, id_parent) VALUES (?, ?)', [name, id_parent || null]);
        const participantId = result.insertId;
        // Handle attributes if provided
        if (attributes && attributes.length > 0) {
            // First get inherited attributes if there's a parent
            let inheritedAttributes = [];
            if (id_parent) {
                const [inherited] = await connection.query(`WITH RECURSIVE parent_chain AS (
            SELECT id, id_parent FROM participant WHERE id = ?
            UNION ALL
            SELECT p.id, p.id_parent FROM participant p
            INNER JOIN parent_chain pc ON p.id = pc.id_parent
          )
          SELECT DISTINCT va.name, va.format_data, av.value 
          FROM parent_chain pc
          JOIN variable_attribute va ON va.participant_id = pc.id
          LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ?
          WHERE pc.id != ?`, [id_parent, participantId, participantId]);
                inheritedAttributes = inherited;
            }
            // Filter attributes to only store those that differ from inherited
            const attributesToStore = attributes.filter((attr) => {
                const inherited = inheritedAttributes
                    .find(ia => ia.name === attr.name);
                return !inherited ||
                    inherited.value !== attr.value ||
                    inherited.format_data !== attr.format_data;
            });
            // Create new attributes
            const attributePromises = attributesToStore.map(async (attr) => {
                const [vaResult] = await connection.query('INSERT INTO variable_attribute (participant_id, name, format_data) VALUES (?, ?, ?)', [participantId, attr.name, attr.format_data || null]);
                return {
                    attributeId: vaResult.insertId,
                    value: attr.value || ''
                };
            });
            // For all attributes (new and inherited), create attribute values
            const allAttributeValues = [...await Promise.all(attributePromises)];
            // Insert all attribute values
            const attributeValues = allAttributeValues
                .filter(({ value }) => value !== undefined)
                .map(({ attributeId, value }) => [
                participantId,
                attributeId,
                value || ''
            ]);
            if (attributeValues.length > 0) {
                await connection.query('INSERT INTO attribute_value (participant_id, attribute_id, value) VALUES ?', [attributeValues]);
            }
        }
        await connection.commit();
        // Fetch the created participant with its complete structure
        const [newParticipant] = await connection.query('SELECT * FROM participant WHERE id = ?', [participantId]);
        // Get participant's own attributes
        const [ownAttributes] = await connection.query('SELECT va.*, av.value FROM variable_attribute va ' +
            'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
            'WHERE va.participant_id = ?', [participantId, participantId]);
        // Get inherited attributes if parent exists
        let inheritedAttributes = [];
        if (id_parent) {
            const [inherited] = await connection.query(`WITH RECURSIVE parent_chain AS (
          SELECT id, id_parent FROM participant WHERE id = ?
          UNION ALL
          SELECT p.id, p.id_parent FROM participant p
          INNER JOIN parent_chain pc ON p.id = pc.id_parent
        )
        SELECT DISTINCT va.*, av.value 
        FROM parent_chain pc
        JOIN variable_attribute va ON va.participant_id = pc.id
        LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ?
        WHERE pc.id != ?`, [id_parent, participantId, participantId]);
            inheritedAttributes = inherited;
        }
        newParticipant[0].attributes = [...ownAttributes, ...inheritedAttributes];
        console.log('Successfully created participant:', newParticipant[0]);
        res.status(201).json(newParticipant[0]);
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}));
// Update a participant
router.put('/:id', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { name, id_parent, attributes } = req.body;
    console.log(`Updating participant ${id}:`, { name, id_parent });
    if (!name) {
        console.log('Missing required fields');
        res.status(400).json({ message: 'Name is required' });
        return;
    }
    const connection = await db_js_1.default.getConnection();
    await connection.beginTransaction();
    try {
        // Validate parent if provided
        if (id_parent) {
            const [parentRows] = await connection.query('SELECT id FROM participant WHERE id = ?', [id_parent]);
            if (!parentRows[0]) {
                throw new Error('Parent participant not found');
            }
            // Check for circular reference
            const [circularCheck] = await connection.query(`WITH RECURSIVE parent_chain AS (
          SELECT id, id_parent FROM participant WHERE id = ?
          UNION ALL
          SELECT p.id, p.id_parent FROM participant p
          INNER JOIN parent_chain pc ON p.id = pc.id_parent
        )
        SELECT id FROM parent_chain WHERE id = ?`, [id_parent, id]);
            if (circularCheck.length > 0) {
                throw new Error('Circular reference detected in parent-child relationship');
            }
        }
        // Update participant
        const [result] = await connection.query('UPDATE participant SET name = ?, id_parent = ? WHERE id = ?', [name, id_parent || null, id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            console.log(`Participant with ID ${id} not found`);
            res.status(404).json({ message: 'Participant not found' });
            return;
        }
        // Update attribute values
        if (attributes && attributes.length > 0) {
            // First get all inherited attributes to know which ones are actually overridden
            const [inheritedAttributes] = await connection.query(`WITH RECURSIVE parent_chain AS (
          SELECT id, id_parent FROM participant WHERE id = ?
          UNION ALL
          SELECT p.id, p.id_parent FROM participant p
          INNER JOIN parent_chain pc ON p.id = pc.id_parent
        )
        SELECT DISTINCT va.name, va.format_data, av.value 
        FROM parent_chain pc
        JOIN variable_attribute va ON va.participant_id = pc.id
        LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ?
        WHERE pc.id != ?`, [id_parent, id, id]);
            // Get current participant's own attributes
            const [currentAttributes] = await connection.query('SELECT va.*, av.value FROM variable_attribute va ' +
                'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
                'WHERE va.participant_id = ?', [id, id]);
            // Delete existing attribute values for this participant
            await connection.query('DELETE FROM attribute_value WHERE participant_id = ?', [id]);
            // Delete existing variable attributes for this participant
            await connection.query('DELETE FROM variable_attribute WHERE participant_id = ?', [id]);
            // Filter attributes to only include ones that differ from inherited
            const attributesToStore = attributes.filter((attr) => {
                const inherited = inheritedAttributes
                    .find(ia => ia.name === attr.name);
                // Store if:
                // 1. No inherited value exists, or
                // 2. The value is different from inherited, or
                // 3. The format is different from inherited
                return !inherited ||
                    inherited.value !== attr.value ||
                    inherited.format_data !== attr.format_data;
            });
            // Insert new variable attributes and their values
            const attributePromises = attributesToStore.map(async (attr) => {
                const [vaResult] = await connection.query('INSERT INTO variable_attribute (participant_id, name, format_data) VALUES (?, ?, ?)', [id, attr.name, attr.format_data || null]);
                return {
                    attributeId: vaResult.insertId,
                    value: attr.value || '' // Ensure value is never null
                };
            });
            const attributeResults = await Promise.all(attributePromises);
            // Insert new attribute values
            const attributeValues = attributeResults
                .filter(({ value }) => value !== undefined) // Only include attributes with values
                .map(({ attributeId, value }) => [
                id,
                attributeId,
                value || '' // Ensure value is never null
            ]);
            if (attributeValues.length > 0) {
                await connection.query('INSERT INTO attribute_value (participant_id, attribute_id, value) VALUES ?', [attributeValues]);
            }
        }
        await connection.commit();
        // Fetch the updated participant with complete structure
        const [updatedParticipant] = await connection.query('SELECT * FROM participant WHERE id = ?', [id]);
        // Get participant's own attributes
        const [ownAttributes] = await connection.query('SELECT va.*, av.value FROM variable_attribute va ' +
            'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
            'WHERE va.participant_id = ?', [id, id]);
        // Get inherited attributes if parent exists
        let inheritedAttributes = [];
        if (id_parent) {
            const [inherited] = await connection.query(`WITH RECURSIVE parent_chain AS (
          SELECT id, id_parent FROM participant WHERE id = ?
          UNION ALL
          SELECT p.id, p.id_parent FROM participant p
          INNER JOIN parent_chain pc ON p.id = pc.id_parent
        )
        SELECT DISTINCT va.*, av.value 
        FROM parent_chain pc
        JOIN variable_attribute va ON va.participant_id = pc.id
        LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ?
        WHERE pc.id != ?`, [id_parent, id, id]);
            inheritedAttributes = inherited;
        }
        updatedParticipant[0].attributes = [...ownAttributes, ...inheritedAttributes];
        console.log('Successfully updated participant:', updatedParticipant[0]);
        res.json(updatedParticipant[0]);
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}));
// Delete a participant
router.delete('/:id', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log(`Deleting participant with ID: ${id}`);
    const connection = await db_js_1.default.getConnection();
    await connection.beginTransaction();
    try {
        // Check if participant has children
        const [children] = await connection.query('SELECT id FROM participant WHERE id_parent = ?', [id]);
        if (children.length > 0) {
            throw new Error('Cannot delete participant with children. Please delete or reassign children first.');
        }
        // Delete attribute values
        await connection.query('DELETE FROM attribute_value WHERE participant_id = ?', [id]);
        // Delete variable attributes
        await connection.query('DELETE FROM variable_attribute WHERE participant_id = ?', [id]);
        // Delete participant
        const [result] = await connection.query('DELETE FROM participant WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            console.log(`Participant with ID ${id} not found`);
            res.status(404).json({ message: 'Participant not found' });
            return;
        }
        await connection.commit();
        console.log(`Successfully deleted participant with ID: ${id}`);
        res.status(204).end();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}));
// Add a new attribute to a participant
router.post('/:id/attributes', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { name, description, format_data, value } = req.body;
    console.log(`Adding new attribute to participant ${id}:`, req.body);
    const connection = await db_js_1.default.getConnection();
    await connection.beginTransaction();
    try {
        // Check if participant exists
        const [participant] = await connection.query('SELECT * FROM participant WHERE id = ?', [id]);
        if (!participant[0]) {
            throw new Error('Participant not found');
        }
        // Check if attribute already exists
        const [existingAttr] = await connection.query('SELECT va.* FROM variable_attribute va WHERE va.participant_id = ? AND va.name = ?', [id, name]);
        let attributeId;
        if (existingAttr[0]) {
            // Update existing attribute
            await connection.query('UPDATE variable_attribute SET description = ?, format_data = ? WHERE id = ?', [description || null, format_data || null, existingAttr[0].id]);
            attributeId = existingAttr[0].id;
        }
        else {
            // Create new attribute
            const [result] = await connection.query('INSERT INTO variable_attribute (participant_id, name, description, format_data) VALUES (?, ?, ?, ?)', [id, name, description || null, format_data || null]);
            attributeId = result.insertId;
        }
        // Handle attribute value if provided
        if (value !== undefined) {
            // Delete any existing value
            await connection.query('DELETE FROM attribute_value WHERE participant_id = ? AND attribute_id = ?', [id, attributeId]);
            // Insert new value
            await connection.query('INSERT INTO attribute_value (participant_id, attribute_id, value) VALUES (?, ?, ?)', [id, attributeId, value || '']);
        }
        // Get the complete attribute with its value
        const [attributes] = await connection.query('SELECT va.*, av.value FROM variable_attribute va ' +
            'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.participant_id = ? ' +
            'WHERE va.id = ?', [id, attributeId]);
        await connection.commit();
        console.log('Successfully created/updated attribute:', attributes[0]);
        res.status(201).json(attributes[0]);
    }
    catch (error) {
        await connection.rollback();
        console.error('Error creating/updating attribute:', error);
        throw error;
    }
    finally {
        connection.release();
    }
}));
exports.default = router;
