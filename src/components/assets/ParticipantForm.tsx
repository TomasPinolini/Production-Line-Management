import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { VariableAttribute } from '../../types';

interface AttributeValue {
  id: number;
  value: string;
}

interface ParticipantFormProps {
  typeId: string;
  participant?: {
    id_Participant: number;
    name: string;
    attributeValues: Record<number, string>;
  };
  attributes: VariableAttribute[];
  onSubmit: (data: { name: string; attributes: AttributeValue[] }) => void;
  onCancel: () => void;
}

export default function ParticipantForm({
  typeId,
  participant,
  attributes,
  onSubmit,
  onCancel
}: ParticipantFormProps) {
  const [name, setName] = useState(participant?.name || '');
  const [attributeValues, setAttributeValues] = useState<Record<number, string>>(
    participant?.attributeValues || {}
  );
  const [formatErrors, setFormatErrors] = useState<Record<number, boolean>>({});

  const validateFormat = (value: string, format: string): boolean => {
    try {
      const regex = new RegExp(format);
      return regex.test(value);
    } catch (err) {
      console.error('Invalid regex pattern:', err);
      return true; // If the regex is invalid, we don't block the input
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    // Validate all attributes
    const errors: Record<number, boolean> = {};
    let hasError = false;

    attributes.forEach(attr => {
      const value = attributeValues[attr.id];
      if (!value || !value.trim()) {
        toast.error(`${attr.name} is required`);
        hasError = true;
        return;
      }

      if (attr.format_data && !validateFormat(value, attr.format_data)) {
        errors[attr.id] = true;
        toast.error(`${attr.name} does not match the required format`);
        hasError = true;
      }
    });

    if (hasError) {
      setFormatErrors(errors);
      return;
    }

    // Transform attributes from Record to Array format
    const attributesArray = Object.entries(attributeValues).map(([id, value]) => ({
      id: parseInt(id),
      value
    }));

    onSubmit({ 
      name, 
      attributes: attributesArray 
    });
  };

  const handleAttributeChange = (attributeId: number, value: string, format: string) => {
    const updatedValues = { ...attributeValues };
    updatedValues[attributeId] = value;
    setAttributeValues(updatedValues);

    // Validate format as user types
    if (format && value) {
      setFormatErrors(prev => ({
        ...prev,
        [attributeId]: !validateFormat(value, format)
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      {attributes.map(attribute => (
        <div key={attribute.id} className="space-y-1">
          <label htmlFor={`attr-${attribute.id}`} className="block text-sm font-medium text-gray-700">
            {attribute.name}
          </label>
          {attribute.description && (
            <p className="text-sm text-gray-500">{attribute.description}</p>
          )}
          <input
            type="text"
            id={`attr-${attribute.id}`}
            value={attributeValues[attribute.id] || ''}
            onChange={e => handleAttributeChange(attribute.id, e.target.value, attribute.format_data || '')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              formatErrors[attribute.id]
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
            required
          />
          {attribute.format_data && (
            <p className="mt-1 text-xs text-gray-500">
              Format: {attribute.format_data}
            </p>
          )}
          {formatErrors[attribute.id] && (
            <p className="mt-1 text-xs text-red-600">
              Value does not match the required format
            </p>
          )}
        </div>
      ))}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {participant ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}