import React, { useState, useEffect } from 'react';
import { Plus, EditIcon, DeleteIcon } from '../../utils/icons';
import toast from 'react-hot-toast';
import { ParticipantType, VariableAttribute } from '../../types';
import VariableAttributeManager from './VariableAttributeManager';

const API_BASE_URL = 'http://localhost:3000/api';

export const ParticipantTypeManager: React.FC = () => {
  const [participantTypes, setParticipantTypes] = useState<ParticipantType[]>([]);
  const [newType, setNewType] = useState({ name: '', description: '' });
  const [selectedType, setSelectedType] = useState<ParticipantType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipantTypes();
  }, []);

  const fetchParticipantTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/participant-types`);
      if (!response.ok) throw new Error('Failed to fetch participant types');
      const data = await response.json();
      setParticipantTypes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load participant types';
      setError(message);
      console.error('Error fetching participant types:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/participant-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newType),
      });

      if (!response.ok) throw new Error('Failed to add participant type');
      
      const addedType = await response.json();
      setParticipantTypes([...participantTypes, addedType]);
      setNewType({ name: '', description: '' });
      toast.success('Participant type added successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add participant type';
      setError(message);
      console.error('Error adding participant type:', err);
      toast.error(message);
    }
  };

  const handleDeleteType = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/participant-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete participant type');
      
      setParticipantTypes(participantTypes.filter(type => type.id !== id));
      if (selectedType?.id === id) {
        setSelectedType(null);
      }
      toast.success('Participant type deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete participant type';
      setError(message);
      console.error('Error deleting participant type:', err);
      toast.error(message);
    }
  };

  const handleAttributesChange = (attributes: VariableAttribute[]) => {
    if (selectedType) {
      const updatedType = { ...selectedType, attributes };
      setSelectedType(updatedType);
      setParticipantTypes(types => 
        types.map(type => 
          type.id === selectedType.id ? updatedType : type
        )
      );
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Participant Types</h2>
        <form onSubmit={handleAddType} className="mt-4 flex gap-2">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              placeholder="New participant type name"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </button>
        </form>

        <div className="space-y-4 mt-6">
          {participantTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No participant types found</p>
          ) : (
            participantTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">{type.name}</span>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedType(type)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Manage Attributes
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedType && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              Managing Attributes for: {selectedType.name}
            </h3>
            <button
              onClick={() => setSelectedType(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
          <VariableAttributeManager
            participantTypeId={selectedType.id}
            onAttributesChange={handleAttributesChange}
          />
        </div>
      )}
    </div>
  );
}; 