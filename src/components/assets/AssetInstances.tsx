import React, { useState, useEffect } from 'react';
import { Asset, VariableAttribute } from '../../types';
import { Edit2, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface AssetAttribute extends Omit<VariableAttribute, 'value'> {
  value: string | undefined;
  source_asset: string;
  is_inherited: boolean;
}

interface AssetInstance extends Omit<Asset, 'attributes'> {
  attributes: AssetAttribute[];
}

interface AssetLevel {
  assetId: number | null;
  options: Array<{
    id: number;
    name: string;
    attributes: Array<VariableAttribute & { source_asset?: string; is_inherited?: boolean }>;
    hasChildren: boolean;
  }>;
}

const API_BASE_URL = 'http://localhost:3000/api';

export const AssetInstances: React.FC = () => {
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [assetLevels, setAssetLevels] = useState<AssetLevel[]>([{ assetId: null, options: [] }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    attributeValues: {} as Record<number, string>
  });

  // Get the currently selected asset
  const selectedAsset = assetLevels.length > 0 
    ? assetLevels[assetLevels.length - 1].options.find(
        asset => asset.id === assetLevels[assetLevels.length - 1].assetId
      )
    : null;

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/assets/roots`);
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        const data = await response.json();
        setAssetLevels([{ assetId: null, options: data }]);
      } catch (error) {
        console.error('Error fetching assets:', error);
        toast.error('Failed to load assets');
      }
    };

    fetchAssets();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      fetchInstances(selectedAsset.id);
    }
  }, [selectedAsset]);

  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  const fetchChildAssets = async (parentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/${parentId}/children`);
      if (!response.ok) throw new Error('Failed to load child assets');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching child assets:', err);
      toast.error('Failed to load child assets');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleAssetChange = async (levelIndex: number, assetId: number | null) => {
    if (assetId === null) {
      // If clearing a selection, remove all levels after this one
      setAssetLevels(prev => prev.slice(0, levelIndex + 1));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/children`);
      if (!response.ok) {
        throw new Error('Failed to fetch child assets');
      }
      const children = await response.json();

      // Update the current level's selection
      setAssetLevels(prev => {
        const newLevels = [...prev];
        newLevels[levelIndex] = { ...newLevels[levelIndex], assetId };
        
        // Add a new level if there are children
        if (children.length > 0) {
          newLevels[levelIndex + 1] = { assetId: null, options: children };
        }
        
        return newLevels;
      });
    } catch (error) {
      console.error('Error fetching child assets:', error);
      toast.error('Failed to load child assets');
    }
  };

  const fetchInstances = async (assetId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/instances/${assetId}`);
      if (!response.ok) throw new Error('Failed to load instances');
      const data = await response.json();
      console.log('Fetched instances data:', data);
      setInstances(data);
      setError(null);
    } catch (err) {
      setError('Failed to load instances');
      toast.error('Failed to load instances');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttributes = async (assetId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/all-attributes`);
      if (!response.ok) throw new Error('Failed to load attributes');
      const data = await response.json();
      console.log('Fetched attributes data:', data);
      return data;
    } catch (err) {
      console.error('Error fetching attributes:', err);
      toast.error('Failed to load attributes');
      return [];
    }
  };

  const validateAttributeValue = (value: string, format: string): boolean => {
    try {
      const trimmedValue = value.trim();
      console.log('Validating value:', {
        original: value,
        trimmed: trimmedValue,
        format: format
      });
      const regex = new RegExp(format);
      const isValid = regex.test(trimmedValue);
      console.log('Validation result:', isValid);
      return isValid;
    } catch (err) {
      console.error('Invalid regex pattern:', err);
      return false;
    }
  };

  const handleAttributeChange = (attributeId: number, value: string) => {
    console.log('Attribute change:', {
      attributeId,
      value,
      trimmedValue: value.trim()
    });
    setFormData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [attributeId]: value.trim()
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    // Validate all attributes
    const invalidAttributes = selectedAsset.attributes.filter(attr => {
      const value = formData.attributeValues[attr.id] || '';
      return !attr.is_reference && attr.format_data && !validateAttributeValue(value, attr.format_data);
    });

    if (invalidAttributes.length > 0) {
      toast.error('Please fix the invalid attribute values');
      return;
    }

    try {
      const attributeValues = selectedAsset.attributes.map(attr => {
        const value = formData.attributeValues[attr.id] || '';
        return {
          attribute_id: attr.id,
          value: attr.is_reference ? null : value,
          referenced_asset_id: attr.is_reference ? parseInt(value) : null
        };
      });

      console.log('Submitting with attribute values:', attributeValues);

      const response = await fetch(`${API_BASE_URL}/assets/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          id_parent: selectedAsset.id,
          attributeValues
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create instance');
      }
      
      toast.success('Instance created successfully');
      setIsAddModalOpen(false);
      setFormData({ name: '', attributeValues: {} });
      fetchInstances(selectedAsset.id);
    } catch (err) {
      console.error('Error creating instance:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create instance');
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      // Fetch the complete hierarchy of assets
      const response = await fetch(`${API_BASE_URL}/assets/hierarchy`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAvailableAssets(data);
    } catch (error) {
      console.error('Error fetching available assets:', error);
      toast.error('Failed to fetch available assets');
    }
  };

  const getAssetsUnderParent = (parentId: number): Asset[] => {
    return availableAssets.filter(asset => {
      // Start with the current asset
      if (asset.id_parent === parentId) return true;
      
      // Check the parent chain
      let currentParentId = asset.id_parent;
      while (currentParentId) {
        const parentAsset = availableAssets.find(a => a.id === currentParentId);
        if (!parentAsset) break;
        
        if (parentAsset.id_parent === parentId) {
          return true;
        }
        currentParentId = parentAsset.id_parent;
      }
      return false;
    });
  };

  const renderAttributeInput = (attribute: VariableAttribute & { source_asset?: string }) => {
    const value = formData.attributeValues[attribute.id] || '';
    const isValid = !attribute.format_data || validateAttributeValue(value, attribute.format_data);

    // For reference attributes, get all assets under the referenced parent asset
    const relevantAssets = attribute.is_reference && attribute.asset_id
      ? getAssetsUnderParent(attribute.asset_id)
      : [];

    const selectedAsset = attribute.is_reference && value 
      ? relevantAssets.find(asset => asset.id.toString() === value)
      : null;

    return (
      <div key={attribute.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {attribute.name}
          {attribute.source_asset && (
            <span className="ml-1 text-xs text-blue-600">
              (from {attribute.source_asset})
            </span>
          )}
          {attribute.description && (
            <span className="ml-1 text-sm text-gray-500">
              ({attribute.description})
            </span>
          )}
        </label>
        {attribute.is_reference ? (
          <Select
            value={selectedAsset ? { value: selectedAsset.id, label: selectedAsset.name } : null}
            onChange={(option) => handleAttributeChange(attribute.id, option ? option.value.toString() : '')}
            options={relevantAssets.map(asset => ({
              value: asset.id,
              label: asset.name
            }))}
            isClearable
            isSearchable
            placeholder={`Search and select a ${attribute.name.toLowerCase()}...`}
            className="mt-1"
            classNamePrefix="react-select"
            noOptionsMessage={() => `No ${attribute.name.toLowerCase()} found`}
            styles={{
              control: (base) => ({
                ...base,
                borderColor: '#D1D5DB',
                '&:hover': {
                  borderColor: '#3B82F6'
                }
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#BFDBFE' : 'white',
                color: state.isSelected ? 'white' : '#111827'
              })
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              ${!isValid && value ? 'border-red-300' : ''}`}
            required
          />
        )}
        {attribute.format_data && !attribute.is_reference && (
          <p className="mt-1 text-sm text-gray-500">
            Format: {attribute.format_data}
          </p>
        )}
        {!isValid && value && !attribute.is_reference && (
          <p className="mt-1 text-sm text-red-600">
            Value does not match the required format
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  // Group attributes by source for display
  const getAttributesBySource = (asset: { 
    name: string;
    attributes: Array<VariableAttribute & { source_asset?: string; is_inherited?: boolean }> 
  }) => {
    return asset.attributes.reduce((groups, attr) => {
      const source = attr.is_inherited ? attr.source_asset || 'Unknown' : asset.name;
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(attr);
      return groups;
    }, {} as Record<string, Array<VariableAttribute & { source_asset?: string; is_inherited?: boolean }>>);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        {assetLevels.map((level, index) => (
          <div key={index} className="flex items-center space-x-2">
            <select
              value={level.assetId || ''}
              onChange={(e) => handleAssetChange(index, e.target.value ? parseInt(e.target.value) : null)}
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

      {selectedAsset && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Instances of {selectedAsset.name}
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instance
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {instances[0]?.attributes.map(attr => (
                    <th 
                      key={`header-${attr.id}`} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {attr.name}
                      {attr.is_inherited && (
                        <span className="ml-1 text-xs text-blue-600 normal-case">
                          (from {attr.source_asset})
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instances.map(instance => (
                  <tr key={instance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {instance.name}
                    </td>
                    {instance.attributes.map(attr => (
                      <td 
                        key={`value-${instance.id}-${attr.id}`} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {attr.value || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isAddModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New {selectedAsset.name} Instance
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              {/* Group attributes by source */}
              {Object.entries(getAttributesBySource(selectedAsset)).map(([source, attributes]) => (
                <div key={source} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {source === selectedAsset.name ? 'Instance Attributes' : `Attributes from ${source}`}
                  </h4>
                  {attributes.map(attr => renderAttributeInput(attr))}
                </div>
              ))}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-600"
                >
                  Create Instance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetInstances; 