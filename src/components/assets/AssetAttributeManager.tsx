import React, { useState, useEffect } from 'react';
import { VariableAttribute, Asset } from '../../types';
import { Plus, EditIcon, DeleteIcon, CloseIcon } from '../../utils/icons';
import toast from 'react-hot-toast';

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
    format_data: ''
  });

  useEffect(() => {
    if (assetId) {
      loadAttributes();
    }
  }, [assetId]);

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

  const handleAddAttribute = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAttribute),
      });

      if (!response.ok) throw new Error('Failed to add attribute');

      const addedAttribute = await response.json();

      // Update the state
      setAttributeGroups(prev => prev.map(group => {
        if (group.assetId === assetId) {
          return {
            ...group,
            attributes: [...group.attributes, addedAttribute]
          };
        }
        return group;
      }));

      setIsAddModalOpen(false);
      setNewAttribute({ name: '', description: '', format_data: '' });
      toast.success('Attribute added successfully');
      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      console.error('Error adding attribute:', error);
      toast.error('Failed to add attribute');
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
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes/${editingAttribute.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingAttribute),
      });

      if (!response.ok) throw new Error('Failed to update attribute');

      const updatedAttribute = await response.json();

      // Update the state
      setAttributeGroups(prev => prev.map(group => {
        if (group.assetId === assetId) {
          return {
            ...group,
            attributes: group.attributes.map(attr =>
              attr.id === updatedAttribute.id ? updatedAttribute : attr
            )
          };
        }
        return group;
      }));

      setEditingAttribute(null);
      toast.success('Attribute updated successfully');
      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      console.error('Error updating attribute:', error);
      toast.error('Failed to update attribute');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Asset Attributes</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Attribute
        </button>
      </div>

      {attributeGroups.map(group => (
        <div key={group.assetId} className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-500">
              {group.assetName}
            </h4>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {group.attributes.map(attr => (
                <li key={attr.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium">{attr.name}</h5>
                      {attr.description && (
                        <p className="text-sm text-gray-500">{attr.description}</p>
                      )}
                      {attr.format_data && (
                        <p className="text-xs text-gray-400">
                          Format: {attr.format_data}
                        </p>
                      )}
                    </div>
                    {group.assetId === assetId && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingAttribute(attr)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttribute(attr.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Add Attribute Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Attribute</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                  value={newAttribute.name}
                  onChange={(e) =>
                    setNewAttribute((prev) => ({ ...prev, name: e.target.value }))
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
                  value={newAttribute.description}
                  onChange={(e) =>
                    setNewAttribute((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
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
                  value={newAttribute.format_data}
                  onChange={(e) =>
                    setNewAttribute((prev) => ({
                      ...prev,
                      format_data: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttribute}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  Add Attribute
                </button>
              </div>
            </div>
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