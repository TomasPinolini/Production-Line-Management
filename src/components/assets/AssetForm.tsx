import React, { useState, useEffect } from 'react';
import { Asset, VariableAttribute } from '../../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface InheritedAttribute extends VariableAttribute {
  sourceAsset: string;
  default_value?: string;
  is_inherited?: boolean;
  required?: boolean;
}

interface AssetFormProps {
  attributes: VariableAttribute[];
  parentId?: number;
  onSubmit: (assetData: {
    name: string;
    attributes: {
      id: number;
      value: string;
      is_reference?: boolean;
      referenced_asset_id?: number;
    }[];
  }) => Promise<void>;
  onCancel: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({ attributes, parentId, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [inheritedAttributes, setInheritedAttributes] = useState<InheritedAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, string>>({});
  const [referenceValues, setReferenceValues] = useState<Record<number, number>>({});
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInheritedAttributes = async () => {
      if (!parentId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all attributes from the parent chain
        const response = await fetch(`${API_BASE_URL}/assets/${parentId}/inherited-attributes`);
        if (!response.ok) throw new Error('Failed to fetch attributes');
        
        const attributes = await response.json();
        setInheritedAttributes(attributes);
        
        // Initialize attribute values with defaults if available
        const initialValues: Record<number, string> = {};
        attributes.forEach((attr: InheritedAttribute) => {
          initialValues[attr.id] = attr.default_value || '';
        });
        setAttributeValues(initialValues);
      } catch (error) {
        console.error('Error fetching inherited attributes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInheritedAttributes();
  }, [parentId]);

  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  const fetchAvailableAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAvailableAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const validateAttribute = (attr: InheritedAttribute, value: string): string => {
    if (!value && attr.required) {
      return `${attr.name} is required`;
    }
    if (attr.format_data && value) {
      try {
        const regex = new RegExp(attr.format_data);
        if (!regex.test(value)) {
          return `Value must match format: ${attr.format_data}`;
        }
      } catch (err) {
        console.error(`Invalid regex pattern for ${attr.name}:`, err);
      }
    }
    return '';
  };

  const handleAttributeChange = (attributeId: number, value: string, attr: InheritedAttribute) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));

    const error = validateAttribute(attr, value);
    setValidationErrors(prev => ({
      ...prev,
      [attributeId]: error
    }));
  };

  const handleReferenceChange = (attributeId: number, assetId: number) => {
    setReferenceValues(prev => ({
      ...prev,
      [attributeId]: assetId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all attributes
    const errors: Record<number, string> = {};
    let hasErrors = false;
    
    inheritedAttributes.forEach(attr => {
      const value = attributeValues[attr.id] || '';
      const error = validateAttribute(attr, value);
      if (error) {
        errors[attr.id] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    const attributeData = inheritedAttributes.map(attr => ({
      id: attr.id,
      value: attributeValues[attr.id] || '',
      is_reference: attr.is_reference,
      referenced_asset_id: attr.is_reference ? referenceValues[attr.id] : undefined
    }));

    await onSubmit({
      name,
      attributes: attributeData
    });
  };

  // Group attributes by their source
  const groupedAttributes = inheritedAttributes.reduce((groups, attr) => {
    const source = attr.sourceAsset;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(attr);
    return groups;
  }, {} as Record<string, InheritedAttribute[]>);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      {Object.entries(groupedAttributes).map(([source, attributes]) => (
        <div key={source} className="space-y-4 border-t pt-4 first:border-t-0 first:pt-0">
          <h3 className="text-lg font-medium text-gray-900">
            Inherited from {source}
          </h3>
          {attributes.map((attr) => (
            <div key={attr.id} className="space-y-2">
              <label
                htmlFor={`attr-${attr.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                {attr.name}
                <span className="ml-1 text-gray-500">
                  ({attr.description})
                </span>
                {attr.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>
              {attr.is_reference ? (
                <select
                  value={referenceValues[attr.id] || ''}
                  onChange={(e) => handleReferenceChange(attr.id, Number(e.target.value))}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                    validationErrors[attr.id]
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                >
                  <option value="">Select an asset</option>
                  {availableAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id={`attr-${attr.id}`}
                  value={attributeValues[attr.id] || ''}
                  onChange={(e) => handleAttributeChange(attr.id, e.target.value, attr)}
                  pattern={attr.format_data || undefined}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                    validationErrors[attr.id]
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  required={attr.required}
                  placeholder={attr.format_data ? `Format: ${attr.format_data}` : undefined}
                />
              )}
              {validationErrors[attr.id] && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors[attr.id]}
                </p>
              )}
              {attr.format_data && !validationErrors[attr.id] && (
                <p className="mt-1 text-sm text-gray-500">
                  Format: {attr.format_data}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Asset
        </button>
      </div>
    </form>
  );
};

export default AssetForm; 