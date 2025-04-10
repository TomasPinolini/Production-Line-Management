import React, { useEffect, useState } from 'react';
import { ParticipantType } from '../types/database';
import { ParticipantTypeRepository } from '../repositories/ParticipantTypeRepository';
import toast from 'react-hot-toast';

export const ParticipantTypeManager: React.FC = () => {
  const [participantTypes, setParticipantTypes] = useState<ParticipantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadParticipantTypes();
  }, []);

  const loadParticipantTypes = async () => {
    try {
      setLoading(true);
      const types = await ParticipantTypeRepository.findAll();
      setParticipantTypes(types);
    } catch (error) {
      console.error('Failed to load participant types:', error);
      toast.error('Failed to load participant types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ParticipantTypeRepository.create(newType);
      toast.success('Participant type created successfully');
      setNewType({ name: '', description: '' });
      loadParticipantTypes();
    } catch (error) {
      console.error('Failed to create participant type:', error);
      toast.error('Failed to create participant type');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this participant type?')) {
      return;
    }

    try {
      await ParticipantTypeRepository.delete(id);
      toast.success('Participant type deleted successfully');
      loadParticipantTypes();
    } catch (error) {
      console.error('Failed to delete participant type:', error);
      toast.error('Failed to delete participant type');
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Participant Types</h2>
      
      {/* Create new participant type form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Create New Participant Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Participant Type
        </button>
      </form>

      {/* List of participant types */}
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participantTypes.map((type) => (
              <tr key={type.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{type.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{type.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 