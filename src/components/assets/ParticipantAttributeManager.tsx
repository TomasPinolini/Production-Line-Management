import React, { useState, useEffect } from 'react';
import { Plus, EditIcon, DeleteIcon, ChevronRight } from '../../utils/icons';
import { VariableAttribute, Participant } from '../../types';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api';

interface Props {
  participantId: number;
  onAttributesChange?: (attributes: VariableAttribute[]) => void;
}

interface AttributeGroup {
  participantId: number;
  participantName: string;
  attributes: VariableAttribute[];
  level: number;
  isInherited: boolean;
}

const ParticipantAttributeManager: React.FC<Props> = ({ participantId, onAttributesChange }) => {
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [newAttribute, setNewAttribute] = useState({ 
    name: '', 
    description: '',
    format_data: '^.{0,20}$' // Default format pattern for varchar(20)
  });
  const [editingAttribute, setEditingAttribute] = useState<VariableAttribute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (participantId) {
      fetchAttributes();
    }
  }, [participantId]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the current participant and build the parent chain
      const participantResponse = await fetch(`${API_BASE_URL}/participants/${participantId}`);
      if (!participantResponse.ok) throw new Error('Failed to fetch participant details');
      const participant = await participantResponse.json();

      // Build the parent chain
      const parentChain: Participant[] = [];
      let currentParticipant: Participant | null = participant;
      
      while (currentParticipant) {
        parentChain.unshift(currentParticipant); // Add to start of array
        if (currentParticipant.id_parent) {
          const parentResponse = await fetch(`${API_BASE_URL}/participants/${currentParticipant.id_parent}`);
          if (!parentResponse.ok) break;
          currentParticipant = await parentResponse.json();
        } else {
          currentParticipant = null;
        }
      }

      // Now fetch attributes for each participant in the chain
      const groups: AttributeGroup[] = [];
      const processedAttributes = new Set<string>(); // Track attributes by name to avoid duplicates

      // First fetch inherited attributes
      for (let i = 0; i < parentChain.length - 1; i++) {
        const p = parentChain[i];
        const attributesResponse = await fetch(`${API_BASE_URL}/participants/${p.id}/attributes`);
        if (!attributesResponse.ok) continue;
        const attributes = await attributesResponse.json();

        // Filter out attributes that have been overridden by children
        const newAttributes = attributes.filter((attr: VariableAttribute) => !processedAttributes.has(attr.name));
        
        // Add new attribute names to processed set
        newAttributes.forEach((attr: VariableAttribute) => processedAttributes.add(attr.name));

        if (newAttributes.length > 0) {
          groups.push({
            participantId: p.id,
            participantName: `Inherited from ${p.name}`,
            attributes: newAttributes,
            level: i,
            isInherited: true
          });
        }
      }

      // Then fetch own attributes
      const ownAttributesResponse = await fetch(`${API_BASE_URL}/participants/${participantId}/attributes`);
      if (ownAttributesResponse.ok) {
        const ownAttributes = await ownAttributesResponse.json();
        
        // Filter out attributes that would override parent attributes
        const newOwnAttributes = ownAttributes.filter((attr: VariableAttribute) => !processedAttributes.has(attr.name));
        
        if (newOwnAttributes.length > 0) {
          groups.push({
            participantId,
            participantName: 'Own Attributes',
            attributes: newOwnAttributes,
            level: parentChain.length - 1,
            isInherited: false
          });
        }
      }

      setAttributeGroups(groups);
      onAttributesChange?.(groups.flatMap(g => g.attributes));
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
    if (!newAttribute.name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    // Check if attribute name already exists in hierarchy
    const existingAttribute = attributeGroups.find(group => 
      group.attributes.some(attr => attr.name === newAttribute.name)
    );

    if (existingAttribute) {
      toast.error(`Attribute "${newAttribute.name}" already exists in the hierarchy`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/participants/${participantId}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAttribute),
      });

      if (!response.ok) {
        throw new Error('Failed to add attribute');
      }

      const addedAttribute = await response.json();

      // Update local state
      const updatedGroups = [...attributeGroups];
      const ownGroupIndex = updatedGroups.findIndex(g => !g.isInherited);

      if (ownGroupIndex !== -1) {
        updatedGroups[ownGroupIndex] = {
          ...updatedGroups[ownGroupIndex],
          attributes: [...updatedGroups[ownGroupIndex].attributes, addedAttribute]
        };
      } else {
        updatedGroups.push({
          participantId,
          participantName: 'Own Attributes',
          attributes: [addedAttribute],
          level: updatedGroups.length,
          isInherited: false
        });
      }

      setAttributeGroups(updatedGroups);
      onAttributesChange?.(updatedGroups.flatMap(g => g.attributes));
      setNewAttribute({ name: '', description: '', format_data: '^.{0,20}$' });
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
      const response = await fetch(`${API_BASE_URL}/participants/${participantId}/attributes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attribute');
      
      const updatedGroups = attributeGroups.map(group => {
        if (group.participantId === participantId) {
          return {
            ...group,
            attributes: group.attributes.filter(attr => attr.id !== id)
          };
        }
        return group;
      });
      setAttributeGroups(updatedGroups);
      onAttributesChange?.(updatedGroups.flatMap(group => group.attributes));
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
      const response = await fetch(`${API_BASE_URL}/participants/${participantId}/attributes/${editingAttribute.id}`, {
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
      const updatedGroups = attributeGroups.map(group => {
        if (group.participantId === participantId) {
          return {
            ...group,
            attributes: group.attributes.map(attr => 
              attr.id === updatedAttribute.id ? updatedAttribute : attr
            )
          };
        }
        return group;
      });
      setAttributeGroups(updatedGroups);
      onAttributesChange?.(updatedGroups.flatMap(group => group.attributes));
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
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Participant Attributes</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading attributes...</div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div 
                className="flex-shrink-0 w-1 h-6"
                style={{ backgroundColor: '#3B82F6' }}
              />
              <div className="text-sm font-medium text-gray-700">
                Add New Attribute
              </div>
            </div>
            
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Format (Regex)</label>
                <input
                  type="text"
                  value={newAttribute.format_data}
                  onChange={(e) => setNewAttribute({ ...newAttribute, format_data: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Default: ^.{0,20}$ (varchar(20))"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Current format: {newAttribute.format_data || 'None'} <br/>
                  This pattern allows any text up to 20 characters.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </button>
            </form>
          </div>

          {attributeGroups.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Attribute Hierarchy</h4>
              {attributeGroups.map((group) => (
                <div key={group.participantId} className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="flex-shrink-0 w-1 h-6" 
                      style={{ 
                        backgroundColor: group.isInherited
                          ? `hsl(${200 + (group.level * 30)}, 70%, 50%)`
                          : '#3B82F6'
                      }}
                    />
                    <div className="text-sm font-medium text-gray-700">
                      {group.participantName}
                    </div>
                  </div>

                  <div className="mt-2">
                    <ul className="space-y-3">
                      {group.attributes.map((attribute) => (
                        <li 
                          key={attribute.id} 
                          className={`bg-gray-50 p-3 rounded-md ${
                            !group.isInherited ? 'border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{attribute.name}</p>
                              {attribute.description && (
                                <p className="text-sm text-gray-600 mt-1">{attribute.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">Format: {attribute.format_data}</p>
                            </div>
                            {!group.isInherited && (
                              <div className="flex space-x-2">
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
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParticipantAttributeManager; 