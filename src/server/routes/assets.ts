import { Router, Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

interface ParentAsset extends RowDataPacket {
  id: number;
}

interface VariableAttribute extends RowDataPacket {
  id: number;
  asset_id: number;
  name: string;
  description: string | null;
  format_data: string | null;
  is_reference: boolean;
  is_shared: boolean;
  is_inherited: boolean;
  inherited_from: number | null;
  is_value_inherited: boolean;
}

interface AttributeValue extends RowDataPacket {
  value: string;
}

// Get all assets
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const [assets] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM asset'
  );
  res.json(assets);
}));

// Get all assets with their attributes
router.get('/assets', asyncHandler(async (_req: Request, res: Response) => {
  console.log('Assets endpoint called');
  const connection = await pool.getConnection();
  try {
    console.log('Getting assets from database');
    // Get all assets (including those without attributes)
    const [assets] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE asset_hierarchy AS (
        -- Get all root assets and assets with attributes
        SELECT 
          a.*,
          CAST(a.id AS CHAR(200)) as path,
          IF(a.id_parent IS NULL, 0, 1) as level
        FROM asset a
        WHERE a.id_parent IS NULL  -- Include all root assets
           OR EXISTS (SELECT 1 FROM variable_attribute va WHERE va.asset_id = a.id)  -- And assets with attributes
        
        UNION ALL
        
        -- Get parents of assets (they become assets too)
        SELECT 
          p.*,
          CONCAT(p.id, ',', ah.path),
          ah.level - 1
        FROM asset p
        INNER JOIN asset_hierarchy ah ON ah.id_parent = p.id
      )
      SELECT DISTINCT * FROM asset_hierarchy
      ORDER BY path`
    );

    console.log('Assets found:', assets);

    if (!assets || assets.length === 0) {
      console.log('No assets found, returning empty array');
      res.json([]);
      return;
    }

    // For each asset, get its attributes (if any) and build hierarchy
    const assetsWithDetails = await Promise.all(
      assets.map(async (asset) => {
        // Get attributes for this asset (if any)
        const [attributes] = await connection.query<RowDataPacket[]>(
          `SELECT va.id, va.name, va.description, va.format_data
           FROM variable_attribute va
           WHERE va.asset_id = ?`,
          [asset.id]
        );

        // Get direct children that are either root assets or have attributes
        const [children] = await connection.query<RowDataPacket[]>(
          `SELECT DISTINCT a.* 
           FROM asset a
           LEFT JOIN variable_attribute va ON va.asset_id = a.id
           WHERE a.id_parent = ?
           AND (va.id IS NOT NULL OR a.id_parent IS NULL)`,
          [asset.id]
        );

        return {
          ...asset,
          attributes: attributes || [],
          children: children || [],
          isAsset: true
        };
      })
    );

    // Build the complete hierarchy tree
    const buildAssetTree = (assets: any[], parentId: number | null = null): any[] => {
      return assets
        .filter(a => a.id_parent === parentId)
        .map(asset => ({
          ...asset,
          children: buildAssetTree(assets, asset.id)
        }));
    };

    // Return either flat list or tree based on query parameter
    const { tree } = _req.query;
    const result = tree === 'true' 
      ? buildAssetTree(assetsWithDetails)
      : assetsWithDetails;

    res.json(result);
  } catch (error) {
    console.error('Error in assets endpoint:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

// Get all root assets
router.get('/roots', asyncHandler(async (_req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const [roots] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.* 
       FROM asset a
       WHERE a.id_parent IS NULL
       ORDER BY a.name`
    );

    if (!roots || roots.length === 0) {
      res.json([]);
      return;
    }

    // Get attributes for each root asset (if they exist)
    const assetsWithAttributes = await Promise.all(
      roots.map(async (asset) => {
        // Check if asset has attributes
        const [attributes] = await connection.query<RowDataPacket[]>(`
          SELECT 
            va.*,
            a.name as source_asset,
            false as is_inherited
          FROM asset a
          LEFT JOIN variable_attribute va ON va.asset_id = a.id
          WHERE a.id = ?
          ORDER BY va.name
        `, [asset.id]);

        // Check if this asset has children
        const [hasChildren] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) as count
           FROM asset a
           WHERE a.id_parent = ?`,
          [asset.id]
        );

        return {
          ...asset,
          attributes: attributes.map(attr => ({
            ...attr,
            is_reference: Boolean(attr.is_reference)  // Ensure boolean type
          })) || [],
          hasChildren: hasChildren[0].count > 0
        };
      })
    );

    res.json(assetsWithAttributes);
  } catch (error) {
    console.error('Error fetching root assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

// Get child assets of a specific parent asset
router.get('/:parentId/children', asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params;
  console.log(`Getting children of asset ${parentId}`);
  
  const connection = await pool.getConnection();
  try {
    const [childAssets] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.* 
       FROM asset a
       WHERE a.id_parent = ?
       ORDER BY a.name`,
      [parentId]
    );

    if (!childAssets || childAssets.length === 0) {
      res.json([]);
      return;
    }

    // Get attributes for each child asset (if they exist)
    const assetsWithDetails = await Promise.all(
      childAssets.map(async (asset) => {
        // Get all attributes from this asset and its ancestors
        const [attributes] = await connection.query<RowDataPacket[]>(`
          WITH RECURSIVE asset_chain AS (
            -- Start with the current asset
            SELECT id, name, id_parent
            FROM asset
            WHERE id = ?
            
            UNION ALL
            
            -- Get all ancestors
            SELECT p.id, p.name, p.id_parent
            FROM asset p
            JOIN asset_chain ac ON p.id = ac.id_parent
          )
          SELECT 
            va.*,
            a.name as source_asset,
            CASE 
              WHEN va.asset_id = ? THEN false 
              ELSE true 
            END as is_inherited
          FROM asset_chain ac
          JOIN asset a ON a.id = ac.id
          JOIN variable_attribute va ON va.asset_id = ac.id
          ORDER BY va.name`,
          [asset.id, asset.id]
        );

        // Check if this asset has children that are also assets
        const [hasChildren] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) as count
           FROM asset a
           JOIN variable_attribute va ON va.asset_id = a.id
           WHERE a.id_parent = ?`,
          [asset.id]
        );

        return {
          ...asset,
          attributes: attributes.map(attr => ({
            ...attr,
            is_reference: Boolean(attr.is_reference)  // Ensure boolean type
          })) || [],
          hasChildren: hasChildren[0].count > 0
        };
      })
    );

    res.json(assetsWithDetails);
  } catch (error) {
    console.error('Error fetching child assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
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
  const { name, id_parent, attributes } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Insert the asset
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO asset (name, id_parent) VALUES (?, ?)',
      [name, id_parent]
    );
    
    const assetId = result.insertId;

    // Get all attributes from the parent chain
    if (id_parent) {
      const [parentAttributes] = await connection.query<RowDataPacket[]>(
        `WITH RECURSIVE asset_chain AS (
          SELECT id, id_parent FROM asset WHERE id = ?
          UNION ALL
          SELECT p.id, p.id_parent FROM asset p
          JOIN asset_chain pc ON p.id = pc.id_parent
        )
        SELECT DISTINCT va.*, av.value 
        FROM asset_chain ac
        JOIN variable_attribute va ON va.asset_id = ac.id
        LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.asset_id = ?`,
        [id_parent, id_parent]
      );

      // Store values for inherited attributes
      if (attributes && attributes.length > 0) {
        for (const attr of attributes) {
          // Find the corresponding parent attribute
          const parentAttr = parentAttributes.find(pa => pa.id === attr.id);
          if (parentAttr) {
            await connection.query(
              'INSERT INTO attribute_value (asset_id, attribute_id, value) VALUES (?, ?, ?)',
              [assetId, attr.id, attr.value]
            );
          }
        }
      }
    }

    await connection.commit();

    // Get the complete asset with all attributes
    const [newAsset] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM asset WHERE id = ?',
      [assetId]
    );

    // Get all attribute values (including inherited ones)
    const [allAttributes] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE asset_chain AS (
        SELECT id, id_parent FROM asset WHERE id = ?
        UNION ALL
        SELECT p.id, p.id_parent FROM asset p
        JOIN asset_chain pc ON p.id = pc.id_parent
      )
      SELECT va.*, av.value, ac.id as source_asset_id
      FROM asset_chain ac
      JOIN variable_attribute va ON va.asset_id = ac.id
      LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.asset_id = ?`,
      [id_parent || assetId, assetId]
    );

    // Add the attributes to the response
    newAsset[0].attributes = allAttributes.map(attr => ({
      ...attr,
      inherited: attr.source_asset_id !== assetId,
      value: attr.value || null
    }));

    res.status(201).json(newAsset[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  const { name, description, format_data, value, is_reference, referenced_asset_id } = req.body;
  
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Validate the value against the format pattern if both are provided
    if (format_data && value !== undefined && !is_reference) {
      try {
        const regex = new RegExp(format_data);
        if (!regex.test(value)) {
          res.status(400).json({ message: 'Value does not match the provided format pattern' });
          return;
        }
      } catch (err) {
        console.error('Invalid regex pattern:', err);
      }
    }

    // If this is a reference attribute, validate the referenced asset exists
    if (is_reference && referenced_asset_id) {
      const [asset] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM asset WHERE id = ?',
        [referenced_asset_id]
      );
      
      if (!asset[0]) {
        res.status(400).json({ message: 'Referenced asset does not exist' });
        return;
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

      // If this is a reference attribute, create the reference
      if (is_reference && referenced_asset_id) {
        await connection.query(
          'INSERT INTO attribute_asset_reference (attribute_value_id, referenced_asset_id) VALUES (?, ?)',
          [result.insertId, referenced_asset_id]
        );
      }
    }
    
    await connection.commit();
    
    // Get the complete attribute with its value and reference
    const [attribute] = await connection.query<RowDataPacket[]>(`
      SELECT 
        va.*, 
        av.value,
        CASE 
          WHEN aar.referenced_asset_id IS NOT NULL THEN JSON_OBJECT(
            'id', a.id,
            'name', a.name
          )
          ELSE NULL
        END as referenced_asset
      FROM variable_attribute va
      LEFT JOIN attribute_value av ON va.id = av.attribute_id AND av.asset_id = ?
      LEFT JOIN attribute_asset_reference aar ON av.id = aar.attribute_value_id AND aar.is_deleted = FALSE
      LEFT JOIN asset a ON aar.referenced_asset_id = a.id
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
router.put('/:id/attributes/:attributeId/value', asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params;
  const { value, is_reference, referenced_asset_id } = req.body;
  
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

    // Validate the value against the format pattern if not a reference
    const { format_data } = attributes[0];
    if (format_data && !is_reference) {
      try {
        const regex = new RegExp(format_data);
        if (!regex.test(value)) {
          res.status(400).json({ message: 'Value does not match the required format pattern' });
          return;
        }
      } catch (err) {
        console.error('Invalid regex pattern:', err);
      }
    }

    // If this is a reference attribute, validate the referenced asset exists
    if (is_reference && referenced_asset_id) {
      const [asset] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM asset WHERE id = ?',
        [referenced_asset_id]
      );
      
      if (!asset[0]) {
        res.status(400).json({ message: 'Referenced asset does not exist' });
        return;
      }
    }

    // Always insert a new value (versioning)
    const [valueResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO attribute_value (asset_id, attribute_id, value, created_at) VALUES (?, ?, ?, NOW())',
      [id, attributeId, value]
    );

    // Handle asset reference if this is a reference attribute
    if (is_reference) {
      // Soft delete any existing references for this attribute value
      await connection.query(
        'UPDATE attribute_asset_reference SET is_deleted = TRUE, deleted_at = NOW() WHERE attribute_value_id IN (SELECT id FROM attribute_value WHERE asset_id = ? AND attribute_id = ?)',
        [id, attributeId]
      );

      // Create new reference if provided
      if (referenced_asset_id) {
        await connection.query(
          'INSERT INTO attribute_asset_reference (attribute_value_id, referenced_asset_id) VALUES (?, ?)',
          [valueResult.insertId, referenced_asset_id]
        );
      }
    }
    
    await connection.commit();
    
    // Get all values for this attribute, ordered by creation time
    const [attributeValues] = await connection.query<RowDataPacket[]>(`
      SELECT 
        av.*,
        va.name as attribute_name,
        CASE 
          WHEN aar.referenced_asset_id IS NOT NULL THEN JSON_OBJECT(
            'id', a.id,
            'name', a.name
          )
          ELSE NULL
        END as referenced_asset
      FROM attribute_value av
      JOIN variable_attribute va ON va.id = av.attribute_id
      LEFT JOIN attribute_asset_reference aar ON av.id = aar.attribute_value_id AND aar.is_deleted = FALSE
      LEFT JOIN asset a ON aar.referenced_asset_id = a.id
      WHERE av.asset_id = ? AND av.attribute_id = ?
      ORDER BY av.created_at DESC
    `, [id, attributeId]);
    
    res.json({
      current: attributeValues[0],
      history: attributeValues.slice(1)
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Update an attribute definition
router.put('/:id/attributes/:attributeId/definition', asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params;
  const { name, description, format_data } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Update the attribute
    await connection.query(
      'UPDATE variable_attribute SET name = ?, description = ?, format_data = ? WHERE id = ? AND asset_id = ?',
      [name, description, format_data, attributeId, id]
    );

    await connection.commit();

    // Get the updated attribute
    const [attribute] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM variable_attribute WHERE id = ?',
      [attributeId]
    );

    res.json(attribute[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Get instances of an asset
router.get('/instances/:parentId', asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params;
  const connection = await pool.getConnection();
  
  try {
    // Get all instances of the parent, regardless of attributes
    const [instances] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.*
       FROM asset a
       WHERE a.id_parent = ?
       ORDER BY a.id`,
      [parentId]
    );

    // Get attributes if they exist
    const instancesWithValues = await Promise.all(
      instances.map(async (instance) => {
        // Check if parent has any attributes
        const [hasAttributes] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) as count
           FROM variable_attribute
           WHERE asset_id = ?`,
          [parentId]
        );

        // If parent has no attributes, return instance as is
        if (hasAttributes[0].count === 0) {
          return instance;
        }

        // Otherwise, get the complete attribute chain
        const [attributes] = await connection.query<RowDataPacket[]>(`
          WITH RECURSIVE asset_chain AS (
            SELECT id, name, id_parent
            FROM asset 
            WHERE id = ?
            
            UNION ALL
            
            SELECT p.id, p.name, p.id_parent
            FROM asset p
            JOIN asset_chain ac ON p.id = ac.id_parent
          )
          SELECT 
            va.*,
            a.name as source_asset,
            av.value,
            CASE 
              WHEN va.asset_id = ? THEN false 
              ELSE true 
            END as is_inherited
          FROM asset_chain ac
          JOIN asset a ON a.id = ac.id
          JOIN variable_attribute va ON va.asset_id = ac.id
          LEFT JOIN attribute_value av ON av.attribute_id = va.id 
            AND av.asset_id = ?
          ORDER BY ac.id_parent IS NULL DESC, va.name
        `, [parentId, instance.id, instance.id]);

        return {
          ...instance,
          attributes: attributes.map(attr => ({
            id: attr.id,
            name: attr.name,
            description: attr.description,
            format_data: attr.format_data,
            value: attr.value,
            source_asset: attr.source_asset,
            is_inherited: attr.is_inherited
          }))
        };
      })
    );

    res.json(instancesWithValues);
  } finally {
    connection.release();
  }
}));

// Create a new instance
router.post('/instances', asyncHandler(async (req: Request, res: Response) => {
  const { name, id_parent, attributeValues } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Insert the asset
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO asset (name, id_parent, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [name, id_parent]
    );
    
    const instanceId = result.insertId;

    // Get all attributes from the entire parent chain
    const [allAttributes] = await connection.query<RowDataPacket[]>(`
      WITH RECURSIVE asset_chain AS (
        SELECT id, name, id_parent, 1 as level
        FROM asset 
        WHERE id = ?
        
        UNION ALL
        
        SELECT p.id, p.name, p.id_parent, ac.level + 1
        FROM asset p
        JOIN asset_chain ac ON p.id = ac.id_parent
      )
      SELECT 
        va.*,
        a.name as source_asset,
        a.id as source_id,
        ac.level
      FROM asset_chain ac
      JOIN asset a ON a.id = ac.id
      JOIN variable_attribute va ON va.asset_id = ac.id
      ORDER BY ac.level DESC, va.name
    `, [id_parent]);

    // Insert values for all attributes
    if (attributeValues && attributeValues.length > 0) {
      for (const { attribute_id, value } of attributeValues) {
        // Find the attribute definition
        const attribute = allAttributes.find(attr => attr.id === attribute_id);
        if (!attribute) continue;

        // Check if this is a reference attribute by looking at format_data
        const isReference = attribute.format_data?.startsWith('ref:');
        const referencedTypeId = isReference ? parseInt(attribute.format_data.split(':')[1]) : null;

        if (isReference && referencedTypeId) {
          // For reference attributes, validate that the referenced asset exists and is of the correct type
          const referencedAssetId = parseInt(value);
          if (isNaN(referencedAssetId)) {
            await connection.rollback();
            res.status(400).json({ message: `Invalid reference ID for ${attribute.name}` });
            return;
          }

          // Verify the referenced asset exists and is of the correct type
          const [referencedAsset] = await connection.query<RowDataPacket[]>(
            `WITH RECURSIVE asset_hierarchy AS (
              SELECT id, name, id_parent
              FROM asset
              WHERE id = ?
              UNION ALL
              SELECT a.id, a.name, a.id_parent
              FROM asset a
              JOIN asset_hierarchy ah ON a.id = ah.id_parent
            )
            SELECT id FROM asset_hierarchy WHERE id = ?`,
            [referencedAssetId, referencedTypeId]
          );

          if (referencedAsset.length === 0) {
            await connection.rollback();
            res.status(400).json({ 
              message: `Referenced asset with ID ${referencedAssetId} must be of type with ID ${referencedTypeId}` 
            });
            return;
          }

          // Store the reference
          await connection.query(
            'INSERT INTO attribute_value (asset_id, attribute_id, value, created_at) VALUES (?, ?, ?, NOW())',
            [instanceId, attribute_id, referencedAssetId.toString()]
          );
        } else {
          // For non-reference attributes, validate and store the value
          const trimmedValue = (value || '').trim();
          if (attribute.format_data) {
            try {
              const regex = new RegExp(attribute.format_data);
              if (!regex.test(trimmedValue)) {
                await connection.rollback();
                res.status(400).json({ 
                  message: `Value for ${attribute.name} does not match required format: ${attribute.format_data}` 
                });
                return;
              }
            } catch (err) {
              console.error(`Invalid regex pattern for ${attribute.name}:`, err);
            }
          }

          await connection.query(
            'INSERT INTO attribute_value (asset_id, attribute_id, value, created_at) VALUES (?, ?, ?, NOW())',
            [instanceId, attribute_id, trimmedValue]
          );
        }
      }
    }

    await connection.commit();

    // Get the created instance with all its attribute values
    const [instance] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM asset WHERE id = ?',
      [instanceId]
    );

    // Get all attributes and their values
    const [instanceAttributes] = await connection.query<RowDataPacket[]>(`
      WITH RECURSIVE asset_chain AS (
        SELECT id, name, id_parent, 1 as level
        FROM asset 
        WHERE id = ?
        
        UNION ALL
        
        SELECT p.id, p.name, p.id_parent, ac.level + 1
        FROM asset p
        JOIN asset_chain ac ON p.id = ac.id_parent
      )
      SELECT 
        va.*,
        a.name as source_asset,
        av.value,
        ac.level,
        CASE 
          WHEN va.asset_id = ? THEN false 
          ELSE true 
        END as is_inherited
      FROM asset_chain ac
      JOIN asset a ON a.id = ac.id
      JOIN variable_attribute va ON va.asset_id = ac.id
      LEFT JOIN attribute_value av ON av.attribute_id = va.id 
        AND av.asset_id = ?
      ORDER BY ac.level DESC, va.name
    `, [id_parent, instanceId, instanceId]);

    res.status(201).json({
      ...instance[0],
      attributes: instanceAttributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        description: attr.description,
        format_data: attr.format_data,
        value: attr.value,
        source_asset: attr.source_asset,
        is_inherited: attr.is_inherited,
        level: attr.level
      }))
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Get root categories (first level)
router.get('/categories/roots', asyncHandler(async (_req: Request, res: Response) => {
  console.log('Root categories endpoint called');
  const connection = await pool.getConnection();
  try {
    // Get all root level assets
    const [rootCategories] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.* 
       FROM asset a
       WHERE a.id_parent IS NULL
       ORDER BY a.name`
    );

    if (!rootCategories || rootCategories.length === 0) {
      res.json([]);
      return;
    }

    // Get attributes for each root category (if they exist)
    const categoriesWithAttributes = await Promise.all(
      rootCategories.map(async (category) => {
        // Check if category has attributes
        const [attributes] = await connection.query<RowDataPacket[]>(`
          SELECT 
            va.*,
            a.name as source_asset,
            false as is_inherited
          FROM asset a
          LEFT JOIN variable_attribute va ON va.asset_id = a.id
          WHERE a.id = ?
          ORDER BY va.name
        `, [category.id]);

        // Check if this category has children
        const [hasChildren] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) as count
           FROM asset a
           WHERE a.id_parent = ?`,
          [category.id]
        );

        return {
          ...category,
          attributes: attributes.map(attr => ({
            ...attr,
            is_reference: Boolean(attr.is_reference)  // Ensure boolean type
          })) || [],
          hasChildren: hasChildren[0].count > 0
        };
      })
    );

    res.json(categoriesWithAttributes);
  } catch (error) {
    console.error('Error fetching root categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

// Get child categories of a specific category
router.get('/categories/:parentId/children', asyncHandler(async (req: Request, res: Response) => {
  const { parentId } = req.params;
  console.log(`Getting children of category ${parentId}`);
  
  const connection = await pool.getConnection();
  try {
    // Get child categories (those with attributes)
    const [childCategories] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.* 
       FROM asset a
       JOIN variable_attribute va ON va.asset_id = a.id
       WHERE a.id_parent = ?
       ORDER BY a.name`,
      [parentId]
    );

    if (!childCategories || childCategories.length === 0) {
      res.json([]);
      return;
    }

    // Get attributes and check for children
    const categoriesWithDetails = await Promise.all(
      childCategories.map(async (category) => {
        // Get all attributes (including inherited) using recursive CTE
        const [attributes] = await connection.query<RowDataPacket[]>(`
          WITH RECURSIVE asset_chain AS (
            -- Start with current category
            SELECT id, name, id_parent
            FROM asset 
            WHERE id = ?
            
            UNION ALL
            
            -- Get all ancestors
            SELECT p.id, p.name, p.id_parent
            FROM asset p
            JOIN asset_chain ac ON p.id = ac.id_parent
          )
          SELECT 
            va.*,
            a.name as source_asset,
            CASE 
              WHEN va.asset_id = ? THEN false 
              ELSE true 
            END as is_inherited
          FROM asset_chain ac
          JOIN asset a ON a.id = ac.id
          JOIN variable_attribute va ON va.asset_id = ac.id
          ORDER BY va.name`,
          [category.id, category.id]
        );

        // Check if this category has children that are also categories
        const [hasChildren] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) as count
           FROM asset a
           JOIN variable_attribute va ON va.asset_id = a.id
           WHERE a.id_parent = ?`,
          [category.id]
        );

        return {
          ...category,
          attributes: attributes.map(attr => ({
            ...attr,
            is_reference: Boolean(attr.is_reference)  // Ensure boolean type
          })) || [],
          hasChildren: hasChildren[0].count > 0
        };
      })
    );

    res.json(categoriesWithDetails);
  } catch (error) {
    console.error('Error fetching child categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

// Soft delete an asset (set state to 0)
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Find the state attribute for this asset's root parent
    const [rootState] = await connection.query<RowDataPacket[]>(`
      WITH RECURSIVE asset_chain AS (
        SELECT id, id_parent FROM asset WHERE id = ?
        UNION ALL
        SELECT p.id, p.id_parent FROM asset p
        JOIN asset_chain ac ON p.id = ac.id_parent
      )
      SELECT va.id as attribute_id
      FROM asset_chain ac
      JOIN variable_attribute va ON va.asset_id = ac.id
      WHERE va.name = 'state'
      ORDER BY ac.id_parent IS NULL DESC
      LIMIT 1
    `, [id]);

    if (!rootState[0]) {
      res.status(400).json({ message: 'State attribute not found' });
      return;
    }

    // Add new inactive state (0)
    await connection.query(
      'INSERT INTO attribute_value (asset_id, attribute_id, value, created_at) VALUES (?, ?, ?, NOW())',
      [id, rootState[0].attribute_id, '0']
    );

    await connection.commit();
    res.status(200).json({ message: 'Asset marked as inactive' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Get all attributes for an asset (including inherited ones)
router.get('/:id/all-attributes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    const [attributes] = await connection.query<RowDataPacket[]>(`
      WITH RECURSIVE asset_chain AS (
        -- Start with current asset
        SELECT id, name, id_parent, 1 as level
        FROM asset 
        WHERE id = ?
        
        UNION ALL
        
        -- Get all ancestors
        SELECT p.id, p.name, p.id_parent, ac.level + 1
        FROM asset p
        JOIN asset_chain ac ON p.id = ac.id_parent
      )
      SELECT 
        va.*,
        a.name as source_asset,
        CASE 
          WHEN va.asset_id = ? THEN false 
          ELSE true 
        END as is_inherited
      FROM asset_chain ac
      JOIN asset a ON a.id = ac.id
      JOIN variable_attribute va ON va.asset_id = ac.id
      ORDER BY ac.level DESC, va.name
    `, [id, id]);

    res.json(attributes);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

// Add new endpoint for inherited attributes
router.get('/:id/inherited-attributes', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      WITH RECURSIVE asset_chain AS (
        -- Start with the current asset and get its parent
        SELECT a.id, a.name, a.id_parent, 1 as level
        FROM asset a
        WHERE a.id = ?
        
        UNION ALL
        
        -- Get all ancestors recursively
        SELECT p.id, p.name, p.id_parent, ac.level + 1
        FROM asset p
        INNER JOIN asset_chain ac ON p.id = ac.id_parent
      ),
      all_attributes AS (
        -- Get attributes from the entire chain
        SELECT DISTINCT 
          va.*,
          a.name as sourceAsset,
          a.id as source_id,
          ac.level,
          COALESCE(
            (SELECT av.value 
             FROM attribute_value av 
             WHERE av.attribute_id = va.id 
             AND av.asset_id = a.id
             ORDER BY av.created_at DESC 
             LIMIT 1),
            va.default_value
          ) as default_value,
          true as required
        FROM asset_chain ac
        JOIN asset a ON a.id = ac.id
        JOIN variable_attribute va ON va.asset_id = a.id
      )
      SELECT * FROM all_attributes
      ORDER BY level DESC, name;
    `;
    
    const [results] = await pool.query(query, [id]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching inherited attributes:', error);
    res.status(500).json({ error: 'Failed to fetch inherited attributes' });
  }
});

// Delete an attribute
router.delete('/:id/attributes/:attributeId', asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Delete attribute values first (due to foreign key constraints)
    await connection.query(
      'DELETE FROM attribute_value WHERE asset_id = ? AND attribute_id = ?',
      [id, attributeId]
    );

    // Delete the attribute
    await connection.query(
      'DELETE FROM variable_attribute WHERE id = ? AND asset_id = ?',
      [attributeId, id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Attribute deleted successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Get all available assets that can be referenced
router.get('/available-references', asyncHandler(async (req: Request, res: Response) => {
  const { excludeId } = req.query;
  const connection = await pool.getConnection();

  try {
    let query = `
      SELECT a.*, 
        COALESCE(GROUP_CONCAT(p.name ORDER BY hierarchy.level DESC SEPARATOR ' > '), a.name) as full_path
      FROM asset a
      LEFT JOIN (
        WITH RECURSIVE hierarchy AS (
          SELECT id, name, id_parent, 0 as level
          FROM asset
          WHERE id = a.id_parent
          
          UNION ALL
          
          SELECT p.id, p.name, p.id_parent, h.level + 1
          FROM asset p
          INNER JOIN hierarchy h ON h.id_parent = p.id
        )
        SELECT * FROM hierarchy
      ) hierarchy ON TRUE
      LEFT JOIN asset p ON p.id = hierarchy.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (excludeId) {
      query += ' AND a.id != ? AND a.id_parent != ?';
      params.push(excludeId, excludeId);
    }
    
    query += ' GROUP BY a.id ORDER BY full_path';
    
    const [assets] = await connection.query<RowDataPacket[]>(query, params);
    res.json(assets);
  } finally {
    connection.release();
  }
}));

// Get referenced assets for an attribute value
router.get('/:assetId/attributes/:attributeId/references', asyncHandler(async (req: Request, res: Response) => {
  const { assetId, attributeId } = req.params;
  const connection = await pool.getConnection();

  try {
    // First verify this is an asset_reference attribute
    const [attributes] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM variable_attribute WHERE id = ? AND format_data = ?',
      [attributeId, 'asset_reference']
    );

    if (!attributes[0]) {
      res.status(400).json({ message: 'Not an asset reference attribute' });
      return;
    }

    // Get the attribute value record
    const [attributeValues] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM attribute_value WHERE asset_id = ? AND attribute_id = ?',
      [assetId, attributeId]
    );

    const attributeValueId = attributeValues[0]?.id;

    if (!attributeValueId) {
      res.json({ references: [] });
      return;
    }

    // Get all referenced assets with their full paths
    const [references] = await connection.query<RowDataPacket[]>(`
      SELECT 
        a.*,
        ar.is_deleted,
        ar.deleted_at,
        COALESCE(GROUP_CONCAT(p.name ORDER BY hierarchy.level DESC SEPARATOR ' > '), a.name) as full_path
      FROM attribute_asset_reference ar
      JOIN asset a ON ar.referenced_asset_id = a.id
      LEFT JOIN (
        WITH RECURSIVE hierarchy AS (
          SELECT id, name, id_parent, 0 as level
          FROM asset
          WHERE id = a.id_parent
          
          UNION ALL
          
          SELECT p.id, p.name, p.id_parent, h.level + 1
          FROM asset p
          INNER JOIN hierarchy h ON h.id_parent = p.id
        )
        SELECT * FROM hierarchy
      ) hierarchy ON TRUE
      LEFT JOIN asset p ON p.id = hierarchy.id
      WHERE ar.attribute_value_id = ?
      GROUP BY a.id
      ORDER BY full_path`,
      [attributeValueId]
    );

    res.json({ references });
  } finally {
    connection.release();
  }
}));

// Add a reference to an asset
router.post('/:assetId/attributes/:attributeId/references', asyncHandler(async (req: Request, res: Response) => {
  const { assetId, attributeId } = req.params;
  const { referencedAssetId } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verify this is an asset_reference attribute
    const [attributes] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM variable_attribute WHERE id = ? AND format_data = ?',
      [attributeId, 'asset_reference']
    );

    if (!attributes[0]) {
      await connection.rollback();
      res.status(400).json({ message: 'Not an asset reference attribute' });
      return;
    }

    // Prevent self-referencing
    if (assetId === referencedAssetId) {
      await connection.rollback();
      res.status(400).json({ message: 'An asset cannot reference itself' });
      return;
    }

    // Get or create attribute value record
    let [attributeValues] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM attribute_value WHERE asset_id = ? AND attribute_id = ?',
      [assetId, attributeId]
    );

    let attributeValueId: number;

    if (!attributeValues[0]) {
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO attribute_value (asset_id, attribute_id, value) VALUES (?, ?, ?)',
        [assetId, attributeId, '']  // Empty value since the actual references are in another table
      );
      attributeValueId = result.insertId;
    } else {
      attributeValueId = attributeValues[0].id;
    }

    // Check if reference already exists
    const [existingRef] = await connection.query<RowDataPacket[]>(
      'SELECT id, is_deleted FROM attribute_asset_reference WHERE attribute_value_id = ? AND referenced_asset_id = ?',
      [attributeValueId, referencedAssetId]
    );

    if (existingRef[0]) {
      if (existingRef[0].is_deleted) {
        // If it exists but was deleted, undelete it
        await connection.query(
          'UPDATE attribute_asset_reference SET is_deleted = FALSE, deleted_at = NULL WHERE id = ?',
          [existingRef[0].id]
        );
      } else {
        await connection.rollback();
        res.status(400).json({ message: 'Reference already exists' });
        return;
      }
    } else {
      // Add the new reference
      await connection.query(
        'INSERT INTO attribute_asset_reference (attribute_value_id, referenced_asset_id) VALUES (?, ?)',
        [attributeValueId, referencedAssetId]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Reference added successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Remove a reference
router.delete('/:assetId/attributes/:attributeId/references/:referencedAssetId', asyncHandler(async (req: Request, res: Response) => {
  const { assetId, attributeId, referencedAssetId } = req.params;
  const connection = await pool.getConnection();

  try {
    // Get the attribute value record
    const [attributeValues] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM attribute_value WHERE asset_id = ? AND attribute_id = ?',
      [assetId, attributeId]
    );

    if (!attributeValues[0]) {
      res.status(404).json({ message: 'Reference not found' });
      return;
    }

    // Soft delete the reference
    await connection.query(
      `UPDATE attribute_asset_reference 
       SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP 
       WHERE attribute_value_id = ? AND referenced_asset_id = ?`,
      [attributeValues[0].id, referencedAssetId]
    );

    res.json({ message: 'Reference removed successfully' });
  } finally {
    connection.release();
  }
}));

// Get inherited attributes for an asset
router.get('/:assetId/inherited-attributes', async (req, res) => {
  const { assetId } = req.params;
  
  try {
    // Get all parent assets up the hierarchy
    const parentAssetsQuery = `
      WITH RECURSIVE parent_hierarchy AS (
        SELECT id, id_parent, 1 as level
        FROM asset
        WHERE id = ?
        UNION ALL
        SELECT a.id, a.id_parent, ph.level + 1
        FROM asset a
        JOIN parent_hierarchy ph ON a.id = ph.id_parent
      )
      SELECT id FROM parent_hierarchy
      ORDER BY level DESC;
    `;

    const [parentAssets] = await pool.query<ParentAsset[]>(parentAssetsQuery, [assetId]);
    
    // Get all attributes from parent assets
    const attributesQuery = `
      SELECT va.*, a.name as asset_name
      FROM variable_attribute va
      JOIN asset a ON va.asset_id = a.id
      WHERE va.asset_id IN (?)
      AND (va.is_shared = TRUE OR va.is_inherited = TRUE)
      ORDER BY 
        CASE 
          WHEN va.is_value_inherited = TRUE THEN 0
          ELSE 1
        END,
        va.created_at DESC;
    `;

    const parentIds = parentAssets.map(p => p.id);
    const [inheritedAttributes] = await pool.query<VariableAttribute[]>(attributesQuery, [parentIds]);

    res.json(inheritedAttributes);
  } catch (error) {
    console.error('Error fetching inherited attributes:', error);
    res.status(500).json({ error: 'Failed to fetch inherited attributes' });
  }
});

// Set attribute inheritance
router.post('/:assetId/attributes/:attributeId/inherit', async (req, res) => {
  const { assetId, attributeId } = req.params;
  const { inheritValue } = req.body;

  try {
    // Get the original attribute
    const [originalAttribute] = await pool.query<VariableAttribute[]>(
      'SELECT * FROM variable_attribute WHERE id = ?',
      [attributeId]
    );

    if (originalAttribute.length === 0) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    const attribute = originalAttribute[0];

    // Create inherited attribute
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO variable_attribute 
       (asset_id, name, description, format_data, is_reference, is_shared, is_inherited, inherited_from, is_value_inherited)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
      [
        assetId,
        attribute.name,
        attribute.description,
        attribute.format_data,
        attribute.is_reference,
        attribute.is_shared,
        attribute.asset_id,
        inheritValue
      ]
    );

    // If inheriting value, copy the value from parent
    if (inheritValue) {
      const [parentValue] = await pool.query<AttributeValue[]>(
        'SELECT value FROM attribute_value WHERE attribute_id = ? AND asset_id = ?',
        [attributeId, attribute.asset_id]
      );

      if (parentValue.length > 0) {
        await pool.query<ResultSetHeader>(
          'INSERT INTO attribute_value (asset_id, attribute_id, value) VALUES (?, ?, ?)',
          [assetId, result.insertId, parentValue[0].value]
        );
      }
    }

    res.json({ success: true, attributeId: result.insertId });
  } catch (error) {
    console.error('Error setting attribute inheritance:', error);
    res.status(500).json({ error: 'Failed to set attribute inheritance' });
  }
});

// Get complete asset hierarchy
router.get('/hierarchy', asyncHandler(async (_req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    console.log('Fetching asset hierarchy...');
    
    // First, get all assets with their hierarchy information
    const [assets] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE asset_hierarchy AS (
        -- Base case: get all root assets
        SELECT 
          a.*,
          CAST(a.id AS CHAR(200)) as path,
          0 as level
        FROM asset a
        WHERE a.id_parent IS NULL
        
        UNION ALL
        
        -- Recursive case: get all children
        SELECT 
          c.*,
          CONCAT(ah.path, ',', c.id),
          ah.level + 1
        FROM asset c
        INNER JOIN asset_hierarchy ah ON c.id_parent = ah.id
      )
      SELECT DISTINCT * FROM asset_hierarchy
      ORDER BY path`
    );

    console.log('Found assets:', assets?.length || 0);

    // Get attributes for all assets in one query
    const [allAttributes] = await connection.query<RowDataPacket[]>(
      `SELECT 
        va.*,
        a.name as source_asset,
        av.value as current_value
       FROM variable_attribute va
       JOIN asset a ON va.asset_id = a.id
       LEFT JOIN attribute_value av ON av.attribute_id = va.id AND av.asset_id = a.id`
    );

    console.log('Found attributes:', allAttributes?.length || 0);

    // Create a map of attributes by asset_id
    const attributesByAsset = allAttributes.reduce((acc: any, attr) => {
      if (!acc[attr.asset_id]) {
        acc[attr.asset_id] = [];
      }
      acc[attr.asset_id].push({
        ...attr,
        value: attr.current_value,
        is_reference: Boolean(attr.is_reference)
      });
      return acc;
    }, {});

    // Build the tree structure
    const buildTree = (items: any[], parentId: number | null = null): any[] => {
      return items
        .filter(item => {
          const itemParentId = item.id_parent === 0 ? null : item.id_parent;
          return itemParentId === parentId;
        })
        .map(item => ({
          ...item,
          attributes: attributesByAsset[item.id] || [],
          children: buildTree(items, item.id),
          isExpanded: false
        }));
    };

    const hierarchy = buildTree(assets);
    console.log('Built hierarchy with root nodes:', hierarchy?.length || 0);
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching asset hierarchy:', error);
    res.status(500).json({ message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    connection.release();
  }
}));

// Get all ancestors of an asset
router.get('/:id/ancestors', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    const [ancestors] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE asset_ancestors AS (
        SELECT 
          a.*,
          0 as level
        FROM asset a
        WHERE a.id = ?
        
        UNION ALL
        
        SELECT 
          p.*,
          aa.level + 1
        FROM asset p
        INNER JOIN asset_ancestors aa ON aa.id_parent = p.id
      )
      SELECT * FROM asset_ancestors
      WHERE id != ?
      ORDER BY level DESC`,
      [id, id]
    );

    res.json(ancestors);
  } catch (error) {
    console.error('Error fetching asset ancestors:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

export default router; 