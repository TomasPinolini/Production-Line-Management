import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { VariableAttribute } from '../../types';

interface ParticipantFormProps {
  typeId: string;
  participant?: {
    id_Participant: number;
    name: string;
    attributeValues: Record<number, string>;
  };
  attributes: VariableAttribute[];
  onSubmit: (data: { name: string; attributes: Record<number, string> }) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    // Validate required attributes
    const missingAttributes = attributes.filter(
      attr => !attributeValues[attr.id_VA] || !attributeValues[attr.id_VA].trim()
    );

    if (missingAttributes.length > 0) {
      toast.error(`Please fill in all attributes: ${missingAttributes.map(attr => attr.name).join(', ')}`);
      return;
    }

    onSubmit({ name, attributes: attributeValues });
  };

  const handleAttributeChange = (attributeId: number, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
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
        <div key={attribute.id_VA}>
          <label htmlFor={`attr-${attribute.id_VA}`} className="block text-sm font-medium text-gray-700">
            {attribute.name}
          </label>
          <input
            type={attribute.formatData === 'number' ? 'number' : 'text'}
            id={`attr-${attribute.id_VA}`}
            value={attributeValues[attribute.id_VA] || ''}
            onChange={e => handleAttributeChange(attribute.id_VA, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
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