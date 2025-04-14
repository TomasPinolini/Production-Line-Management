import { Router, Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import pool from '../db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

// Get all assets
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const [assets] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM asset'
  );
  res.json(assets);
}));

// Get all categories with their attributes
router.get('/categories', asyncHandler(async (_req: Request, res: Response) => {
  console.log('Categories endpoint called');
  const connection = await pool.getConnection();
  try {
    console.log('Getting categories from database');
    // Get all categories (assets that have attributes defined)
    const [categories] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE category_hierarchy AS (
        -- Get all assets that have attributes defined (these are our categories)
        SELECT 
          a.*,
          CAST(a.id AS CHAR(200)) as path,
          IF(a.id_parent IS NULL, 0, 1) as level
        FROM asset a
        JOIN variable_attribute va ON va.asset_id = a.id
        
        UNION ALL
        
        -- Get parents of categories (they become categories too)
        SELECT 
          p.*,
          CONCAT(p.id, ',', ch.path),
          ch.level - 1
        FROM asset p
        INNER JOIN category_hierarchy ch ON ch.id_parent = p.id
      )
      SELECT DISTINCT * FROM category_hierarchy
      ORDER BY path`
    );

    console.log('Categories found:', categories);

    if (!categories || categories.length === 0) {
      console.log('No categories found, returning empty array');
      res.json([]);
      return;
    }

    // For each category, get its attributes and build hierarchy
    const categoriesWithDetails = await Promise.all(
      categories.map(async (category) => {
        // Get attributes for this category
        const [attributes] = await connection.query<RowDataPacket[]>(
          `SELECT va.id, va.name, va.description, va.format_data
           FROM variable_attribute va
           WHERE va.asset_id = ?`,
          [category.id]
        );

        // Get direct children that are also categories
        const [children] = await connection.query<RowDataPacket[]>(
          `SELECT DISTINCT a.* 
           FROM asset a
           JOIN variable_attribute va ON va.asset_id = a.id
           WHERE a.id_parent = ?`,
          [category.id]
        );

        return {
          ...category,
          attributes: attributes || [],
          children: children || [],
          isCategory: true
        };
      })
    );

    // Build the complete hierarchy tree
    const buildCategoryTree = (categories: any[], parentId: number | null = null): any[] => {
      return categories
        .filter(c => c.id_parent === parentId)
        .map(category => ({
          ...category,
          children: buildCategoryTree(categories, category.id)
        }));
    };

    // Return either flat list or tree based on query parameter
    const { tree } = _req.query;
    const result = tree === 'true' 
      ? buildCategoryTree(categoriesWithDetails)
      : categoriesWithDetails;

    console.log('Categories with details:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}));

// Get root assets with their children
router.get('/roots', asyncHandler(async (_req: Request, res: Response) => {
  console.log('Roots endpoint called');
  const connection = await pool.getConnection();
  try {
    console.log('Getting root assets from database');
    const [roots] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM asset WHERE id_parent IS NULL ORDER BY id`
    );

    console.log('Root assets found:', roots);

    if (!roots || roots.length === 0) {
      console.log('No root assets found, returning empty array');
      res.json([]);
      return;
    }

    // For each root asset, fetch their complete hierarchy
    const rootsWithHierarchy = await Promise.all(
      roots.map(async (root) => {
        // Get all descendants using recursive CTE
        const [descendants] = await connection.query<RowDataPacket[]>(
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
  } catch (error) {
    console.error('Error fetching root assets:', error);
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
      }
    }

    // Always insert a new value (versioning)
    await connection.query(
      'INSERT INTO attribute_value (asset_id, attribute_id, value, created_at) VALUES (?, ?, ?, NOW())',
      [id, attributeId, value]
    );
    
    await connection.commit();
    
    // Get all values for this attribute, ordered by creation time
    const [attributeValues] = await connection.query<RowDataPacket[]>(`
      SELECT av.*, va.name as attribute_name
      FROM attribute_value av
      JOIN variable_attribute va ON va.id = av.attribute_id
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

// Get instances of a category with their attribute values
router.get('/instances/:categoryId', asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const connection = await pool.getConnection();
  
  try {
    // Get all instances of the category that are active (state = 1)
    const [instances] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.*
       FROM asset a
       LEFT JOIN (
         SELECT av.asset_id, av.value as state
         FROM attribute_value av
         JOIN variable_attribute va ON va.id = av.attribute_id
         WHERE va.name = 'state'
         AND NOT EXISTS (
           SELECT 1 FROM attribute_value av2
           WHERE av2.asset_id = av.asset_id
           AND av2.attribute_id = av.attribute_id
           AND av2.created_at > av.created_at
         )
       ) current_state ON current_state.asset_id = a.id
       WHERE a.id_parent = ?
       AND (current_state.state IS NULL OR current_state.state = '1')
       ORDER BY a.id`,
      [categoryId]
    );

    // Get current attribute values for each instance
    const instancesWithValues = await Promise.all(
      instances.map(async (instance) => {
        const [attributeValues] = await connection.query<RowDataPacket[]>(
          `SELECT av.*
           FROM attribute_value av
           WHERE av.asset_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM attribute_value av2
             WHERE av2.asset_id = av.asset_id
             AND av2.attribute_id = av.attribute_id
             AND av2.created_at > av.created_at
           )`,
          [instance.id]
        );
        return {
          ...instance,
          attributeValues
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

    // Insert attribute values if provided
    if (attributeValues && attributeValues.length > 0) {
      for (const { attribute_id, value } of attributeValues) {
        await connection.query(
          'INSERT INTO attribute_value (asset_id, attribute_id, value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [instanceId, attribute_id, value]
        );
      }
    }

    await connection.commit();

    // Get the created instance with its values
    const [instance] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM asset WHERE id = ?',
      [instanceId]
    );

    const [instanceAttributeValues] = await connection.query<RowDataPacket[]>(
      `SELECT av.id, av.attribute_id, av.value
       FROM attribute_value av
       WHERE av.asset_id = ?`,
      [instanceId]
    );

    res.status(201).json({
      ...instance[0],
      attributeValues: instanceAttributeValues
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
    // Get root level categories (those with attributes and no parent)
    const [rootCategories] = await connection.query<RowDataPacket[]>(
      `SELECT DISTINCT a.* 
       FROM asset a
       JOIN variable_attribute va ON va.asset_id = a.id
       WHERE a.id_parent IS NULL
       ORDER BY a.name`
    );

    if (!rootCategories || rootCategories.length === 0) {
      res.json([]);
      return;
    }

    // Get attributes for each root category
    const categoriesWithAttributes = await Promise.all(
      rootCategories.map(async (category) => {
        const [attributes] = await connection.query<RowDataPacket[]>(
          `SELECT va.id, va.name, va.description, va.format_data
           FROM variable_attribute va
           WHERE va.asset_id = ?`,
          [category.id]
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
          attributes: attributes || [],
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
        const [attributes] = await connection.query<RowDataPacket[]>(
          `SELECT va.id, va.name, va.description, va.format_data
           FROM variable_attribute va
           WHERE va.asset_id = ?`,
          [category.id]
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
          attributes: attributes || [],
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

export default router; 