import React, { useState, useEffect } from 'react';
import { Asset, VariableAttribute } from '../../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface AssetFormProps {
  asset?: {
    id_Asset?: number;
    name: string;
    attributeValues: Record<string, string>;
  };
  attributes: VariableAttribute[];
  parentId?: number;
  onSubmit: (data: { name: string; attributes: { id: number; value: string; }[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface AttributeWithSource extends VariableAttribute {
  sourceAssetName?: string;
  inherited?: boolean;
}

const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  attributes,
  parentId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [name, setName] = useState(asset?.name || '');
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(
    asset?.attributeValues || {}
  );
  const [inheritedAttributes, setInheritedAttributes] = useState<AttributeWithSource[]>([]);
  const [parentChain, setParentChain] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchParentChainAndAttributes = async () => {
      if (!parentId) return;
      
      setLoading(true);
      try {
        // First get the immediate parent
        const response = await fetch(`${API_BASE_URL}/assets/${parentId}`);
        if (!response.ok) throw new Error('Failed to fetch parent asset');
        const parent = await response.json();
        
        // Build the parent chain
        const chain: Asset[] = [parent];
        let currentParent = parent;
        
        while (currentParent.id_parent) {
          const parentResponse = await fetch(`${API_BASE_URL}/assets/${currentParent.id_parent}`);
          if (!parentResponse.ok) break;
          currentParent = await parentResponse.json();
          chain.unshift(currentParent);
        }
        
        setParentChain(chain);

        // Get all attributes from the chain
        const allInheritedAttributes: AttributeWithSource[] = [];
        
        for (const parent of chain) {
          const attrResponse = await fetch(`${API_BASE_URL}/assets/${parent.id}/attributes`);
          if (attrResponse.ok) {
            const parentAttrs = await attrResponse.json();
            parentAttrs.forEach((attr: VariableAttribute) => {
              // Only add if not already present (attributes from closer parents take precedence)
              if (!allInheritedAttributes.some(a => a.name === attr.name)) {
                allInheritedAttributes.push({
                  ...attr,
                  sourceAssetName: parent.name,
                  inherited: true
                });
              }
            });
          }
        }

        setInheritedAttributes(allInheritedAttributes);
      } catch (error) {
        console.error('Error fetching parent chain:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParentChainAndAttributes();
  }, [parentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allAttributes = [...attributes, ...inheritedAttributes];
    onSubmit({
      name,
      attributes: allAttributes.map(attr => ({
        id: attr.id,
        value: attributeValues[attr.id.toString()] || ''
      }))
    });
  };

  const handleAttributeChange = (attributeId: number, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  const renderAttributeGroup = (title: string, attrs: AttributeWithSource[], showSource: boolean = false) => {
    if (attrs.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        {attrs.map((attr) => (
          <div key={attr.id} className="mb-4">
            <label
              htmlFor={`attr-${attr.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              {attr.name}
              {attr.description && (
                <span className="ml-1 text-gray-500">({attr.description})</span>
              )}
              {showSource && attr.sourceAssetName && (
                <span className="ml-2 text-xs text-blue-600">
                  Inherited from {attr.sourceAssetName}
                </span>
              )}
            </label>
            <input
              type="text"
              id={`attr-${attr.id}`}
              value={attributeValues[attr.id.toString()] || ''}
              onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
              pattern={attr.format_data}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required={true}
            />
            {attr.format_data && (
              <p className="mt-1 text-sm text-gray-500">
                Format: {attr.format_data}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading || isLoading) {
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

      {renderAttributeGroup('Own Attributes', attributes)}
      {renderAttributeGroup('Inherited Attributes', inheritedAttributes, true)}

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
          {asset ? 'Update' : 'Create'} Asset
        </button>
      </div>
    </form>
  );
};

export default AssetForm; 