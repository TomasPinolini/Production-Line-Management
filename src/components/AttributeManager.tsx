import React, { useState } from 'react';
import { VariableAttribute, ParticipantType } from '../types';
import toast from 'react-hot-toast';

interface AttributeManagerProps {
  participantTypes: ParticipantType[];
  onAddAttribute: (attribute: Omit<VariableAttribute, 'id'>) => Promise<void>;
}

export function AttributeManager({ participantTypes, onAddAttribute }: AttributeManagerProps) {
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    type_id: participantTypes[0]?.id || 1,
    formatData: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddAttribute(newAttribute);
      setNewAttribute({
        name: '',
        type_id: participantTypes[0]?.id || 1,
        formatData: '',
      });
      toast.success('Attribute added successfully!');
    } catch (error) {
      toast.error('Error adding attribute');
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Add New Attribute</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Attribute Name
          </label>
          <input
            type="text"
            id="name"
            value={newAttribute.name}
            onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Participant Type
          </label>
          <select
            id="type"
            value={newAttribute.type_id}
            onChange={(e) => setNewAttribute({ ...newAttribute, type_id: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            {participantTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="formatData" className="block text-sm font-medium text-gray-700">
            Format (Regex Pattern)
          </label>
          <input
            type="text"
            id="formatData"
            value={newAttribute.formatData}
            onChange={(e) => setNewAttribute({ ...newAttribute, formatData: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ for IP address"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Attribute
        </button>
      </div>
    </form>
  );
}