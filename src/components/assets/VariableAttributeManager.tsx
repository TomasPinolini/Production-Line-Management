import React, { useState, useEffect } from 'react';
import { Plus, EditIcon, DeleteIcon } from '../../utils/icons';
import toast from 'react-hot-toast';
import { VariableAttribute } from '../../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface Props {
  participantTypeId: number;
  onAttributesChange?: (attributes: VariableAttribute[]) => void;
}

const VariableAttributeManager: React.FC<Props> = ({ participantTypeId, onAttributesChange }) => {
  const [attributes, setAttributes] = useState<VariableAttribute[]>([]);
  const [newAttribute, setNewAttribute] = useState({ 
    name: '', 
    description: '',
    format_data: '' 
  });
  const [editingAttribute, setEditingAttribute] = useState<VariableAttribute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (participantTypeId) {
      fetchAttributes();
    }
  }, [participantTypeId]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes`);
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const data = await response.json();
      console.log('Fetched attributes:', data);
      setAttributes(data);
      onAttributesChange?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load attributes';
      setError(message);
      console.error('Error fetching attributes:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAttribute),
      });

      if (!response.ok) throw new Error('Failed to add attribute');
      
      const addedAttribute = await response.json();
      setAttributes([...attributes, addedAttribute]);
      setNewAttribute({ name: '', description: '', format_data: '' });
      onAttributesChange?.([...attributes, addedAttribute]);
      toast.success('Attribute added successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add attribute';
      setError(message);
      console.error('Error adding attribute:', err);
      toast.error(message);
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attribute');
      
      setAttributes(attributes.filter(attr => attr.id !== id));
      onAttributesChange?.(attributes.filter(attr => attr.id !== id));
      toast.success('Attribute deleted successfully');
    } catch (err) {
      setError('Failed to delete attribute');
      console.error(err);
      toast.error('Failed to delete attribute');
    }
  };

  const handleUpdateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttribute) return;

    try {
      const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes/${editingAttribute.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingAttribute.name,
          description: editingAttribute.description,
          format_data: editingAttribute.format_data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attribute');
      }

      const updatedAttribute = await response.json();
      setAttributes(attributes.map(attr => 
        attr.id === updatedAttribute.id ? updatedAttribute : attr
      ));
      onAttributesChange?.(attributes.map(attr => 
        attr.id === updatedAttribute.id ? updatedAttribute : attr
      ));
      setEditingAttribute(null);
      toast.success('Attribute updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update attribute';
      setError(message);
      console.error('Error updating attribute:', err);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Variable Attributes</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading attributes...</div>
      ) : (
        <>
          <form onSubmit={handleAddAttribute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Attribute Name</label>
              <input
                type="text"
                value={newAttribute.name}
                onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newAttribute.description}
                onChange={(e) => setNewAttribute({ ...newAttribute, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={2}
                placeholder="Explain what this attribute is for and how to use it"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Format (Regex) - {100 - (newAttribute.format_data?.length || 0)} characters remaining
              </label>
              <input
                type="text"
                value={newAttribute.format_data}
                onChange={(e) => setNewAttribute({ ...newAttribute, format_data: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., ^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$ for IPv4"
                maxLength={100}
              />
              <div className="mt-1 space-y-1 text-sm text-gray-500">
                <p>Examples:</p>
                <p>• IPv4: {'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'}</p>
                <p>• MAC address: {'^(?:[0-9A-Fa-f]{2}(?:[:-]|$)){6}$'}</p>
                <p className="text-xs">Note: For IPv6, use a simpler format like: {'^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$'}</p>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Attribute
            </button>
          </form>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Current Attributes</h4>
            {attributes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No attributes found</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-200">
                {attributes.map((attribute) => (
                  <li key={attribute.id} className="py-3">
                    {editingAttribute?.id === attribute.id ? (
                      <form onSubmit={handleUpdateAttribute} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={editingAttribute.name}
                            onChange={(e) => setEditingAttribute({
                              ...editingAttribute,
                              name: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            value={editingAttribute.description}
                            onChange={(e) => setEditingAttribute({
                              ...editingAttribute,
                              description: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Format (Regex) - {100 - (editingAttribute.format_data?.length || 0)} characters remaining
                          </label>
                          <input
                            type="text"
                            value={editingAttribute.format_data}
                            onChange={(e) => setEditingAttribute({
                              ...editingAttribute,
                              format_data: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            maxLength={100}
                          />
                          <div className="mt-1 space-y-1 text-sm text-gray-500">
                            <p>Examples:</p>
                            <p>• IPv4: {'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'}</p>
                            <p>• MAC address: {'^(?:[0-9A-Fa-f]{2}(?:[:-]|$)){6}$'}</p>
                            <p className="text-xs">Note: For IPv6, use a simpler format like: {'^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAttribute(null)}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attribute.name}</p>
                          {attribute.description && (
                            <p className="text-sm text-gray-600 mt-1">{attribute.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Format: {attribute.format_data}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingAttribute(attribute)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttribute(attribute.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VariableAttributeManager; 