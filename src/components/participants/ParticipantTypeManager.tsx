import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ParticipantType } from '../../types';

const API_BASE_URL = 'http://localhost:3000/api';

export const ParticipantTypeManager: React.FC = () => {
  const [types, setTypes] = useState<ParticipantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<ParticipantType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadParticipantTypes();
  }, []);

  const loadParticipantTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/participant-types`);
      if (!response.ok) {
        throw new Error('Failed to load participant types');
      }
      const data = await response.json();
      setTypes(data);
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
      let response;
      if (editingType) {
        response = await fetch(`${API_BASE_URL}/participant-types/${editingType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/participant-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save participant type');
      }

      setFormData({ name: '', description: '' });
      setEditingType(null);
      toast.success(editingType ? 'Participant type updated successfully' : 'Participant type created successfully');
      loadParticipantTypes();
    } catch (error) {
      console.error('Failed to save participant type:', error);
      toast.error('Failed to save participant type');
    }
  };

  const handleEdit = (type: ParticipantType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || ''
    });
  };

  const handleDelete = async (type: ParticipantType) => {
    if (!window.confirm('Are you sure you want to delete this participant type?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/participant-types/${type.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete participant type');
      }

      toast.success('Participant type deleted successfully');
      loadParticipantTypes();
    } catch (error) {
      console.error('Failed to delete participant type:', error);
      toast.error('Failed to delete participant type');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                Description
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
          {editingType && (
            <button
              type="button"
              onClick={() => {
                setEditingType(null);
                setFormData({ name: '', description: '' });
              }}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingType ? 'Update' : 'Add'} Participant Type
          </button>
        </div>
      </form>

      {/* Types List */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Name
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Description
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {types.map((type) => (
              <tr key={type.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {type.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {type.description || '-'}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(type)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-sm text-gray-500">
                  No participant types found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 