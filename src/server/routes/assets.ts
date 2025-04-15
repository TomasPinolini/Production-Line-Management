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
    // Get all categories (including those without attributes)
    const [categories] = await connection.query<RowDataPacket[]>(
      `WITH RECURSIVE category_hierarchy AS (
        -- Get all root assets and assets with attributes
        SELECT 
          a.*,
          CAST(a.id AS CHAR(200)) as path,
          IF(a.id_parent IS NULL, 0, 1) as level
        FROM asset a
        WHERE a.id_parent IS NULL  -- Include all root assets
           OR EXISTS (SELECT 1 FROM variable_attribute va WHERE va.asset_id = a.id)  -- And assets with attributes
        
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

    // For each category, get its attributes (if any) and build hierarchy
    const categoriesWithDetails = await Promise.all(
      categories.map(async (category) => {
        // Get attributes for this category (if any)
        const [attributes] = await connection.query<RowDataPacket[]>(
          `SELECT va.id, va.name, va.description, va.format_data
           FROM variable_attribute va
           WHERE va.asset_id = ?`,
          [category.id]
        );

        // Get direct children that are either root assets or have attributes
        const [children] = await connection.query<RowDataPacket[]>(
          `SELECT DISTINCT a.* 
           FROM asset a
           LEFT JOIN variable_attribute va ON va.asset_id = a.id
           WHERE a.id_parent = ?
           AND (va.id IS NOT NULL OR a.id_parent IS NULL)`,
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
router.put('/:id/attributes/:attributeId/value', asyncHandler(async (req: Request, res: Response) => {
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
        -- Start with parent category
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
        a.id as source_id,
        ac.level
      FROM asset_chain ac
      JOIN asset a ON a.id = ac.id
      JOIN variable_attribute va ON va.asset_id = ac.id
      ORDER BY ac.level DESC, va.name
    `, [id_parent]);

    // Insert values for all attributes (both direct and inherited)
    if (attributeValues && attributeValues.length > 0) {
      for (const { attribute_id, value } of attributeValues) {
        // Verify this attribute belongs to the parent chain
        const attribute = allAttributes.find(attr => attr.id === attribute_id);
        if (attribute) {
          // Trim the value and validate format if exists
          const trimmedValue = value.trim();
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
        -- Start with current instance's parent
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
          ORDER BY va.name
        `, [category.id, category.id]);

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

    // Get all referenced assets
    const [references] = await connection.query<RowDataPacket[]>(
      `SELECT a.*, ar.is_deleted, ar.deleted_at 
       FROM attribute_asset_reference ar
       JOIN asset a ON ar.referenced_asset_id = a.id
       WHERE ar.attribute_value_id = ?`,
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

    // Add the reference
    await connection.query(
      'INSERT INTO attribute_asset_reference (attribute_value_id, referenced_asset_id) VALUES (?, ?)',
      [attributeValueId, referencedAssetId]
    );

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

export default router; 