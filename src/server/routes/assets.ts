import { Router, Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all root assets (those with null parent)
router.get('/roots', asyncHandler(async (_req: Request, res: Response) => {
  const [rootAssets] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM asset WHERE id_parent IS NULL ORDER BY name ASC'
  );

  // For each root asset, fetch their complete hierarchy
  const rootsWithHierarchy = await Promise.all(
    rootAssets.map(async (root) => {
      // Get all descendants using recursive CTE
      const [descendants] = await pool.query<RowDataPacket[]>(
        `WITH RECURSIVE asset_hierarchy AS (
          -- Base case: direct children of the current root
          SELECT 
            a.*,
            1 as level,
            CAST(a.id AS CHAR(200)) as path
          FROM asset a
          WHERE a.id_parent = ?
          
          UNION ALL
          
          -- Recursive case: children of children
          SELECT 
            a.*,
            ah.level + 1,
            CONCAT(ah.path, ',', a.id)
          FROM asset a
          INNER JOIN asset_hierarchy ah ON a.id_parent = ah.id
        )
        SELECT * FROM asset_hierarchy
        ORDER BY path`,
        [root.id]
      );

      // Build the hierarchy tree
      const buildHierarchy = (assets: RowDataPacket[], parentId: number | null = null): any[] => {
        return assets
          .filter(a => a.id_parent === parentId)
          .map(a => ({
            ...a,
            children: buildHierarchy(assets, a.id)
          }));
      };

      // Return root with its hierarchy
      return {
        ...root,
        children: buildHierarchy(descendants, root.id)
      };
    })
  );

  res.json(rootsWithHierarchy);
}));

// Get all assets
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const [assets] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM asset'
  );
  res.json(assets);
}));

// Get a single asset by ID with its children and attributes
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    // Get asset basic info
    const [assets] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM asset WHERE id = ?',
      [id]
    );
    
    if (!assets[0]) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    
    const asset = assets[0];

    // Get asset's attributes
    const [attributes] = await connection.query<RowDataPacket[]>(
      'SELECT va.*, av.value FROM variable_attribute va ' +
      'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.asset_id = ? ' +
      'WHERE va.asset_id = ?',
      [id, id]
    );

    // Get asset's children
    const [children] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM asset WHERE id_parent = ?',
      [id]
    );

    // Get inherited attributes
    const [inheritedAttributes] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE asset_chain AS (
        SELECT id, id_parent FROM asset WHERE id = ?
        UNION ALL
        SELECT p.id, p.id_parent FROM asset p
        JOIN asset_chain pc ON p.id = pc.id_parent
      )
      SELECT va.*, av.value FROM asset_chain ac
      JOIN variable_attribute va ON va.asset_id = ac.id
      LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.asset_id = ?
      WHERE ac.id != ?`,
      [id, id, id]
    );
    
    asset.attributes = [...attributes, ...inheritedAttributes];
    asset.children = children;

    res.json(asset);
  } finally {
    connection.release();
  }
}));

// Create a new asset
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, id_parent } = req.body;
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO asset (name, id_parent) VALUES (?, ?)',
    [name, id_parent]
  );
  
  const [newAsset] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM asset WHERE id = ?',
    [result.insertId]
  );
  
  res.status(201).json(newAsset[0]);
}));

// Update an asset
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, id_parent, attributes } = req.body;
  
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Update asset basic info
    await connection.query(
      'UPDATE asset SET name = ?, id_parent = ? WHERE id = ?',
      [name, id_parent, id]
    );
    
    // Update attributes if provided
    if (attributes && attributes.length > 0) {
      for (const attr of attributes) {
        if (attr.value) {
          // Check if value exists
          const [existingValue] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM attribute_value WHERE asset_id = ? AND attribute_id = ?',
            [id, attr.id]
          );
          
          if (existingValue[0]) {
            // Update existing value
            await connection.query(
              'UPDATE attribute_value SET value = ? WHERE asset_id = ? AND attribute_id = ?',
              [attr.value, id, attr.id]
            );
          } else {
            // Insert new value
            await connection.query(
              'INSERT INTO attribute_value (asset_id, attribute_id, value) VALUES (?, ?, ?)',
              [id, attr.id, attr.value]
            );
          }
          
          // Record in history
          await connection.query(
            'INSERT INTO history (asset_id, attribute_id, value) VALUES (?, ?, ?)',
            [id, attr.id, attr.value]
          );
        }
      }
    }
    
    await connection.commit();
    
    // Get updated asset with attributes
    const [updatedAsset] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM asset WHERE id = ?',
      [id]
    );
    
    // Get asset's attributes
    const [assetAttributes] = await connection.query<RowDataPacket[]>(
      'SELECT va.*, av.value FROM variable_attribute va ' +
      'LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.asset_id = ? ' +
      'WHERE va.asset_id = ?',
      [id, id]
    );
    
    updatedAsset[0].attributes = assetAttributes;
    
    res.json(updatedAsset[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Delete an asset
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await pool.query(
    'DELETE FROM asset WHERE id = ?',
    [id]
  );
  
  res.status(204).send();
}));

// Get all attributes for an asset
router.get('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const [attributes] = await pool.query<RowDataPacket[]>(`
    SELECT va.*, av.value 
    FROM variable_attribute va
    LEFT JOIN attribute_value av ON va.id = av.attribute_id AND av.asset_id = ?
    WHERE va.asset_id = ?
  `, [id, id]);
  
  res.json(attributes);
}));

// Add a new attribute to an asset
router.post('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, format_data, value } = req.body;
  
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Validate the value against the format pattern if both are provided
    if (format_data && value !== undefined) {
      try {
        const regex = new RegExp(format_data);
        if (!regex.test(value)) {
          res.status(400).json({ message: 'Value does not match the provided format pattern' });
          return;
        }
      } catch (err) {
        console.error('Invalid regex pattern:', err);
        // If the regex is invalid, we'll still allow the creation
      }
    }

    // Insert the attribute definition
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO variable_attribute (asset_id, name, description, format_data) VALUES (?, ?, ?, ?)',
      [id, name, description, format_data]
    );
    
    // Insert the attribute value if provided
    if (value !== undefined) {
      await connection.query(
        'INSERT INTO attribute_value (asset_id, attribute_id, value) VALUES (?, ?, ?)',
        [id, result.insertId, value]
      );
    }
    
    await connection.commit();
    
    // Get the complete attribute with its value
    const [attribute] = await pool.query<RowDataPacket[]>(`
      SELECT va.*, av.value 
      FROM variable_attribute va
      LEFT JOIN attribute_value av ON va.id = av.attribute_id AND av.asset_id = ?
      WHERE va.id = ?
    `, [id, result.insertId]);
    
    res.status(201).json(attribute[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Update an attribute value
router.put('/:id/attributes/:attributeId', asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params;
  const { value } = req.body;
  
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Get the attribute format pattern
    const [attributes] = await connection.query<RowDataPacket[]>(
      'SELECT format_data FROM variable_attribute WHERE id = ?',
      [attributeId]
    );
    
    if (!attributes[0]) {
      res.status(404).json({ message: 'Attribute not found' });
      return;
    }

    // Validate the value against the format pattern
    const { format_data } = attributes[0];
    if (format_data) {
      try {
        const regex = new RegExp(format_data);
        if (!regex.test(value)) {
          res.status(400).json({ message: 'Value does not match the required format pattern' });
          return;
        }
      } catch (err) {
        console.error('Invalid regex pattern:', err);
        // If the regex is invalid, we'll still allow the update
      }
    }

    // Check if value exists
    const [existingValue] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM attribute_value WHERE asset_id = ? AND attribute_id = ?',
      [id, attributeId]
    );
    
    if (existingValue[0]) {
      // Update existing value
      await connection.query(
        'UPDATE attribute_value SET value = ? WHERE asset_id = ? AND attribute_id = ?',
        [value, id, attributeId]
      );
    } else {
      // Insert new value
      await connection.query(
        'INSERT INTO attribute_value (asset_id, attribute_id, value) VALUES (?, ?, ?)',
        [id, attributeId, value]
      );
    }
    
    // Record in history
    await connection.query(
      'INSERT INTO history (asset_id, attribute_id, value) VALUES (?, ?, ?)',
      [id, attributeId, value]
    );
    
    await connection.commit();
    
    // Get the updated attribute with its value
    const [attribute] = await pool.query<RowDataPacket[]>(`
      SELECT va.*, av.value 
      FROM variable_attribute va
      LEFT JOIN attribute_value av ON va.id = av.attribute_id AND av.asset_id = ?
      WHERE va.id = ?
    `, [id, attributeId]);
    
    res.json(attribute[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

export default router; 