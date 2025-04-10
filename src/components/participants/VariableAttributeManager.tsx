import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { VariableAttribute } from '../../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface Props {
  participantTypeId: number;
  onAttributesChange?: (attributes: VariableAttribute[]) => void;
}

const VariableAttributeManager: React.FC<Props> = ({ participantTypeId, onAttributesChange }) => {
  const [attributes, setAttributes] = useState<VariableAttribute[]>([]);
  const [newAttribute, setNewAttribute] = useState({ name: '', formatData: '' });
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
      // Transform the data to match our interface
      const transformedData = data.map((attr: any) => ({
        id_VA: attr.id,
        id_Type: attr.participant_type_id,
        name: attr.name,
        formatData: attr.formatData
      }));
      console.log('Fetched attributes:', transformedData);
      setAttributes(transformedData);
      onAttributesChange?.(transformedData);
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
      // Transform the response to match our interface
      const transformedAttribute: VariableAttribute = {
        id_VA: addedAttribute.id_VA,
        id_Type: addedAttribute.id_Type,
        name: addedAttribute.name,
        formatData: addedAttribute.formatData
      };
      setAttributes([...attributes, transformedAttribute]);
      setNewAttribute({ name: '', formatData: '' });
      onAttributesChange?.([...attributes, transformedAttribute]);
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
      
      setAttributes(attributes.filter(attr => attr.id_VA !== id));
      onAttributesChange?.(attributes.filter(attr => attr.id_VA !== id));
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
      const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes/${editingAttribute.id_VA}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingAttribute.name,
          formatData: editingAttribute.formatData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attribute');
      }

      const updatedAttribute = await response.json();
      setAttributes(attributes.map(attr => 
        attr.id_VA === updatedAttribute.id_VA ? updatedAttribute : attr
      ));
      onAttributesChange?.(attributes.map(attr => 
        attr.id_VA === updatedAttribute.id_VA ? updatedAttribute : attr
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
              <label className="block text-sm font-medium text-gray-700">
                Format (Regex) - {100 - (newAttribute.formatData?.length || 0)} characters remaining
              </label>
              <input
                type="text"
                value={newAttribute.formatData}
                onChange={(e) => setNewAttribute({ ...newAttribute, formatData: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., ^(?:[0-9A-Fa-f]{2}(?:[:-]|$)){6}$ for MAC address"
                maxLength={100}
              />
              <p className="mt-1 text-sm text-gray-500">
                Example for MAC address: ^(?:[0-9A-Fa-f]{2}(?:[:-]|$)){6}$
              </p>
            </div>

            <button
              type="submit"
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                  <li key={attribute.id_VA} className="py-3">
                    {editingAttribute?.id_VA === attribute.id_VA ? (
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
                          <label className="block text-sm font-medium text-gray-700">
                            Format (Regex) - {100 - (editingAttribute.formatData?.length || 0)} characters remaining
                          </label>
                          <input
                            type="text"
                            value={editingAttribute.formatData}
                            onChange={(e) => setEditingAttribute({
                              ...editingAttribute,
                              formatData: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            maxLength={100}
                          />
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
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attribute.name}</p>
                          <p className="text-xs text-gray-400">Format: {attribute.formatData}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingAttribute(attribute)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAttribute(attribute.id_VA)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
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