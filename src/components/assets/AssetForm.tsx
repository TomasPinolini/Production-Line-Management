import React, { useState } from 'react';
import { Asset, VariableAttribute } from '../../types';

interface AssetFormProps {
  asset?: {
    id_Asset?: number;
    name: string;
    attributeValues: Record<string, string>;
  };
  attributes: VariableAttribute[];
  onSubmit: (data: { name: string; attributes: { id: number; value: string; }[] }) => void;
  onCancel: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  attributes,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(asset?.name || '');
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(
    asset?.attributeValues || {}
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      attributes: attributes.map(attr => ({
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

      {attributes.map((attr) => (
        <div key={attr.id}>
          <label
            htmlFor={`attr-${attr.id}`}
            className="block text-sm font-medium text-gray-700"
          >
            {attr.name}
            {attr.description && (
              <span className="ml-1 text-gray-500">({attr.description})</span>
            )}
          </label>
          <input
            type="text"
            id={`attr-${attr.id}`}
            value={attributeValues[attr.id.toString()] || ''}
            onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
            pattern={attr.format_data}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      ))}

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