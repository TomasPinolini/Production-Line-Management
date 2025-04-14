import React, { useState, useEffect } from 'react';
import { DynamicFormData, VariableAttribute } from '../types';
import toast from 'react-hot-toast';

interface DynamicFormProps {
  participantTypeId: number;
  attributes: VariableAttribute[];
  onSubmit: (data: DynamicFormData) => Promise<void>;
  title: string;
}

export function DynamicForm({ participantTypeId, attributes, onSubmit, title }: DynamicFormProps) {
  const [formData, setFormData] = useState<DynamicFormData>({
    participant_name: '',
    attributes: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({ participant_name: '', attributes: {} });
      toast.success('Data saved successfully!');
    } catch (error) {
      toast.error('Error saving data');
      console.error('Error:', error);
    }
  };

  const validateField = (value: string, formatData: string): boolean => {
    try {
      const regex = new RegExp(formatData);
      return regex.test(value);
    } catch {
      // If regex is invalid, return true to avoid blocking submission
      return true;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="participant_name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="participant_name"
            value={formData.participant_name}
            onChange={(e) => setFormData({ ...formData, participant_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        {attributes.map((attr) => (
          <div key={attr.id}>
            <label htmlFor={`attr_${attr.id}`} className="block text-sm font-medium text-gray-700">
              {attr.name}
            </label>
            <input
              type="text"
              id={`attr_${attr.id}`}
              value={formData.attributes[attr.id] || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                const isValid = validateField(newValue, attr.format_data || '');
                setFormData({
                  ...formData,
                  attributes: {
                    ...formData.attributes,
                    [attr.id]: newValue,
                  },
                });
                
                if (!isValid) {
                  toast.error(`Invalid format for ${attr.name}`);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save {title}
        </button>
      </div>
    </form>
  );
}