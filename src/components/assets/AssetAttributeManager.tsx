import React, { useState, useEffect } from 'react';
import { VariableAttribute, Asset } from '../../types';
import { Plus, EditIcon, DeleteIcon, CloseIcon } from '../../utils/icons';
import toast from 'react-hot-toast';
import AssetAttributeInheritance from './AssetAttributeInheritance';

const API_BASE_URL = 'http://localhost:3000/api';

interface AttributeGroup {
  assetId: number;
  assetName: string;
  attributes: VariableAttribute[];
}

interface Props {
  assetId: number;
  onAttributesChange?: () => void;
}

const AssetAttributeManager: React.FC<Props> = ({ assetId, onAttributesChange }) => {
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<VariableAttribute | null>(null);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    description: '',
    format_data: '',
    is_reference: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSelectingReference, setIsSelectingReference] = useState(false);
  const [assetLevels, setAssetLevels] = useState<Array<{
    assetId: number | null;
    options: Array<{
      id: number;
      name: string;
      hasChildren: boolean;
    }>;
  }>>([{ assetId: null, options: [] }]);

  useEffect(() => {
    if (assetId) {
      loadAttributes();
    }
  }, [assetId]);

  useEffect(() => {
    if (isSelectingReference) {
      fetchRootAssets();
    }
  }, [isSelectingReference]);

  const loadAttributes = async () => {
    try {
      // First, get the current asset and build the parent chain
      const assetResponse = await fetch(`${API_BASE_URL}/assets/${assetId}`);
      if (!assetResponse.ok) throw new Error('Failed to fetch asset details');
      const asset = await assetResponse.json();

      // Build the parent chain
      const parentChain: Asset[] = [];
      let currentAsset: Asset | null = asset;

      while (currentAsset) {
        parentChain.unshift(currentAsset); // Add to start of array
        if (currentAsset.id_parent) {
          const parentResponse = await fetch(`${API_BASE_URL}/assets/${currentAsset.id_parent}`);
          if (parentResponse.ok) {
            currentAsset = await parentResponse.json();
          } else {
            currentAsset = null;
          }
        } else {
          currentAsset = null;
        }
      }

      // Now fetch attributes for each asset in the chain
      const groups: AttributeGroup[] = [];

      // Get inherited attributes from parents
      for (const p of parentChain.slice(0, -1)) {
        const attributesResponse = await fetch(`${API_BASE_URL}/assets/${p.id}/attributes`);
        if (attributesResponse.ok) {
          const attributes = await attributesResponse.json();
          if (attributes.length > 0) {
            groups.push({
              assetId: p.id,
              assetName: `Inherited from ${p.name}`,
              attributes
            });
          }
        }
      }

      // Get own attributes
      const ownAttributesResponse = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes`);
      if (ownAttributesResponse.ok) {
        const ownAttributes = await ownAttributesResponse.json();
        groups.push({
          assetId,
          assetName: 'Own Attributes',
          attributes: ownAttributes
        });
      }

      setAttributeGroups(groups);
    } catch (error) {
      console.error('Error loading attributes:', error);
      toast.error('Failed to load attributes');
    }
  };

  const fetchRootAssets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/roots`);
      if (!response.ok) throw new Error('Failed to load root assets');
      const data = await response.json();
      setAssetLevels([{ assetId: null, options: data }]);
    } catch (err) {
      console.error('Error fetching root assets:', err);
      toast.error('Failed to load assets');
    }
  };

  const fetchChildAssets = async (parentId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${parentId}/children`);
      if (!response.ok) throw new Error('Failed to load child assets');
      return await response.json();
    } catch (err) {
      console.error('Error fetching child assets:', err);
      toast.error('Failed to load child assets');
      return [];
    }
  };

  const handleCategoryChange = async (levelIndex: number, assetId: number | null) => {
    try {
      const updatedLevels = [...assetLevels.slice(0, levelIndex + 1)];
      updatedLevels[levelIndex] = {
        ...updatedLevels[levelIndex],
        assetId
      };

      if (assetId !== null) {
        const selectedAsset = assetLevels[levelIndex].options.find(asset => asset.id === assetId);
        if (selectedAsset?.hasChildren) {
          const childAssets = await fetchChildAssets(assetId);
          updatedLevels.push({ assetId: null, options: childAssets });
        }
      }

      setAssetLevels(updatedLevels);
    } catch (err) {
      console.error('Error handling asset change:', err);
      toast.error('Failed to load asset data');
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;

    // Get the selected asset from any level
    const selectedAsset = assetLevels.reduce<{ id: number; name: string; hasChildren: boolean } | null>((selected, level) => {
      if (level.assetId !== null) {
        const asset = level.options.find(asset => asset.id === level.assetId);
        if (asset) return asset;
      }
      return selected;
    }, null);

    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAttribute.name,
          description: newAttribute.description,
          format_data: newAttribute.is_reference 
            ? `ref:${selectedAsset?.id || ''}` // Store reference type in format_data
            : newAttribute.format_data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add attribute');
      }

      toast.success('Attribute added successfully');
      setIsAddModalOpen(false);
      setNewAttribute({
        name: '',
        description: '',
        format_data: '',
        is_reference: false
      });
      setIsSelectingReference(false);
      setAssetLevels([{ assetId: null, options: [] }]);
      loadAttributes();
    } catch (err) {
      console.error('Error adding attribute:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add attribute');
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attribute');

      // Update the state
      setAttributeGroups(prev => prev.map(group => {
        if (group.assetId === assetId) {
          return {
            ...group,
            attributes: group.attributes.filter(attr => attr.id !== id)
          };
        }
        return group;
      }));

      toast.success('Attribute deleted successfully');
      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Failed to delete attribute');
    }
  };

  const handleUpdateAttribute = async () => {
    if (!editingAttribute) return;

    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes/${editingAttribute.id}/definition`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingAttribute.name,
          description: editingAttribute.description,
          format_data: editingAttribute.format_data
        }),
      });

      if (!response.ok) throw new Error('Failed to update attribute');

      const updatedAttribute = await response.json();

      // Update the state with the updated attribute
      setAttributeGroups(prev => prev.map(group => {
        if (group.assetId === assetId) {
          return {
            ...group,
            attributes: group.attributes.map(attr =>
              attr.id === editingAttribute.id ? updatedAttribute : attr
            )
          };
        }
        return group;
      }));

      setEditingAttribute(null);
      toast.success('Attribute definition updated successfully');
      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      console.error('Error updating attribute:', error);
      toast.error('Failed to update attribute');
    }
  };

  const selectedAssetId = assetLevels.find(level => level.assetId !== null)?.assetId;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Asset Attribute Management</h2>
      
      {/* Asset Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Asset</h3>
        <div className="flex space-x-4">
          {assetLevels.map((level, index) => (
            <div key={index} className="flex-1">
              <select
                className="w-full p-2 border rounded"
                value={level.assetId || ''}
                onChange={(e) => handleCategoryChange(index, e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Select Asset</option>
                {level.options.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Show inheritance section if an asset is selected */}
      {selectedAssetId && (
        <div className="mb-6">
          <AssetAttributeInheritance 
            assetId={selectedAssetId}
            onInheritanceChange={loadAttributes}
          />
        </div>
      )}

      {/* Attribute Management */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Attributes</h3>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium text-gray-500">
            {assetLevels.find(level => level.assetId !== null)?.options.find(opt => opt.id === selectedAssetId)?.name || 'No asset selected'}
          </h4>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Attribute
          </button>
        </div>

        {attributeGroups.map((group) => (
          <div key={group.assetId} className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-500">
                {group.assetName}
              </h5>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {group.attributes.map((attr) => (
                  <li key={attr.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h6 className="text-sm font-medium">{attr.name}</h6>
                        {attr.description && (
                          <p className="text-sm text-gray-500">{attr.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingAttribute(attr)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAttribute(attr.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Add Attribute Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Attribute
            </h3>
            <form onSubmit={handleAddAttribute}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newAttribute.name}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newAttribute.description}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attribute Type
                  </label>
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={newAttribute.is_reference}
                        onChange={(e) => {
                          setNewAttribute(prev => ({ ...prev, is_reference: e.target.checked }));
                          setIsSelectingReference(e.target.checked);
                          if (!e.target.checked) {
                            setAssetLevels([{ assetId: null, options: [] }]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Reference to another asset</span>
                    </label>
                  </div>
                </div>

                {newAttribute.is_reference ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Select Asset to Reference</h4>
                    <p className="text-sm text-gray-500">You can select an asset from any level in the hierarchy.</p>
                    {assetLevels.map((level, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <select
                          value={level.assetId || ''}
                          onChange={(e) => handleCategoryChange(index, e.target.value ? parseInt(e.target.value) : null)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Select {index === 0 ? 'Asset' : 'Subasset'}</option>
                          {level.options.map(asset => (
                            <option key={asset.id} value={asset.id}>
                              {asset.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Format Pattern (regex)
                    </label>
                    <input
                      type="text"
                      value={newAttribute.format_data}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, format_data: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., ^[A-Za-z0-9]+$"
                    />
                  </div>
                )}
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsSelectingReference(false);
                    setAssetLevels([{ assetId: null, options: [] }]);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newAttribute.is_reference && !assetLevels.some(level => level.assetId !== null)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 sm:text-sm"
                >
                  Add Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attribute Modal */}
      {editingAttribute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Attribute</h2>
              <button
                onClick={() => setEditingAttribute(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editingAttribute.name}
                  onChange={(e) =>
                    setEditingAttribute((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={editingAttribute.description || ''}
                  onChange={(e) =>
                    setEditingAttribute((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Format (regex)
                </label>
                <input
                  type="text"
                  value={editingAttribute.format_data || ''}
                  onChange={(e) =>
                    setEditingAttribute((prev) =>
                      prev ? { ...prev, format_data: e.target.value } : null
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingAttribute(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAttribute}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  Update Attribute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetAttributeManager; 