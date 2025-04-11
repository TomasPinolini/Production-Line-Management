import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Participant, VariableAttribute } from '../../types';
import { ArrowLeft, Plus, Pencil, Trash2, X, ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ParticipantForm from './ParticipantForm';
import ParticipantAttributeManager from './ParticipantAttributeManager';

const API_BASE_URL = 'http://localhost:3000/api';

interface Breadcrumb {
  id: number;
  name: string;
}

export const ParticipantList: React.FC = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [parentChain, setParentChain] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedParticipants, setExpandedParticipants] = useState<Set<number>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    if (selectedParticipant) {
      fetchChildren(selectedParticipant.id);
    } else {
      fetchRootParticipants();
    }
  }, [selectedParticipant]);

  const fetchRootParticipants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/participants/roots`);
      if (!response.ok) throw new Error('Failed to fetch root participants');
      const rootData = await response.json();
      
      setParticipants(rootData);
      // Expand root participants by default
      const newExpanded = new Set(expandedParticipants);
      rootData.forEach((p: Participant) => {
        if (p.children && p.children.length > 0) {
          newExpanded.add(p.id);
        }
      });
      setExpandedParticipants(newExpanded);
      setLoading(false);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Failed to load participants');
      toast.error('Failed to load participants');
      setLoading(false);
    }
  };

  const fetchChildren = async (parentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/participants/${parentId}`);
      if (!response.ok) throw new Error('Failed to fetch participant');
      const participant = await response.json();
      setParticipants(participant.children || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading children:', err);
      setError('Failed to load children');
      toast.error('Failed to load children');
      setLoading(false);
    }
  };

  const handleParticipantSelect = async (participant: Participant) => {
    setSelectedParticipant(participant);
    setParentChain(prev => [...prev, participant]);
  };

  const handleGoBack = () => {
    if (parentChain.length > 0) {
      const newParentChain = parentChain.slice(0, -1);
      const newSelectedParticipant = newParentChain[newParentChain.length - 1] || null;
      setParentChain(newParentChain);
      setSelectedParticipant(newSelectedParticipant);
    }
  };

  const handleSubmitParticipant = async (data: { 
    name: string; 
    attributes: { 
      id: number; 
      value: string; 
    }[]; 
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          id_parent: selectedParticipant?.id || null,
          attributes: data.attributes
        }),
      });

      if (!response.ok) throw new Error('Failed to create participant');
      
      // Refresh the current level
      if (selectedParticipant) {
        fetchChildren(selectedParticipant.id);
      } else {
        fetchRootParticipants();
      }
      
      setIsAddModalOpen(false);
      toast.success('Participant added successfully');
    } catch (err) {
      console.error('Error adding participant:', err);
      toast.error('Failed to add participant');
    }
  };

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant);
  };

  const handleCloseEdit = () => {
    setEditingParticipant(null);
  };

  const handleParticipantUpdate = async (updatedParticipant: Participant) => {
    try {
      setLoading(true);
      
      // Prepare the update payload
      const updatePayload = {
        name: updatedParticipant.name,
        id_parent: updatedParticipant.id_parent,
        attributes: updatedParticipant.attributes?.map(attr => ({
          name: attr.name,
          description: attr.description || '',
          format_data: attr.format_data || '',
          value: attr.value || ''
        })) || []
      };

      const response = await fetch(`${API_BASE_URL}/participants/${updatedParticipant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update participant');
      }
      
      const data = await response.json();

      // Update the local state
      setParticipants(participants.map(p => p.id === data.id ? data : p));
      setEditingParticipant(null);
      toast.success('Participant updated successfully');

      // Refresh the current view to get updated inheritance
      if (selectedParticipant) {
        fetchChildren(selectedParticipant.id);
      } else {
        fetchRootParticipants();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update participant';
      setError(message);
      console.error('Error updating participant:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete participant');
      
      // Refresh the participants list
      fetchRootParticipants();
      toast.success('Participant deleted successfully');
    } catch (err) {
      console.error('Error deleting participant:', err);
      toast.error('Failed to delete participant');
    }
  };

  const handleParticipantClick = (participant: Participant) => {
    const newExpanded = new Set(expandedParticipants);
    if (newExpanded.has(participant.id)) {
      newExpanded.delete(participant.id);
    } else {
      newExpanded.add(participant.id);
    }
    setExpandedParticipants(newExpanded);
  };

  const handleBreadcrumbClick = (participantId: number) => {
    const index = breadcrumbs.findIndex(b => b.id === participantId);
    if (index !== -1) {
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      // Update expanded state to show the selected participant
      const newExpanded = new Set(expandedParticipants);
      newExpanded.add(participantId);
      setExpandedParticipants(newExpanded);
    }
  };

  const handleAddChild = async (parent: Participant) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `New Child of ${parent.name}`,
          id_parent: parent.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to create child participant');
      const newChild = await response.json();

      // Expand the parent to show the new child
      setExpandedParticipants(prev => new Set([...prev, parent.id]));

      // Refresh the current view to show the new child
      if (selectedParticipant) {
        fetchChildren(selectedParticipant.id);
      } else {
        fetchRootParticipants();
      }

      setLoading(false);
      toast.success('Child participant added successfully');
    } catch (err) {
      console.error('Error adding child participant:', err);
      toast.error('Failed to add child participant');
      setLoading(false);
    }
  };

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
        <span className="cursor-pointer hover:text-blue-600" onClick={() => handleBreadcrumbClick(0)}>
          Root
        </span>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="h-4 w-4" />
            <span
              className={`cursor-pointer hover:text-blue-600 ${
                index === breadcrumbs.length - 1 ? 'font-semibold' : ''
              }`}
              onClick={() => handleBreadcrumbClick(crumb.id)}
            >
              {crumb.name}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderLoadingSkeleton = () => {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-2 py-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderParticipant = (participant: Participant, level: number = 0) => {
    const isExpanded = expandedParticipants.has(participant.id);
    const hasChildren = participant.children && participant.children.length > 0;

    return (
      <div 
        key={participant.id} 
        className={`transition-all duration-200 ease-in-out ${level > 0 ? 'ml-6' : ''}`}
        style={{ 
          opacity: loading ? 0.5 : 1,
          transform: loading ? 'scale(0.98)' : 'scale(1)'
        }}
      >
        <div className="flex items-center space-x-2 py-2 hover:bg-gray-50 rounded transition-colors duration-200">
          <div className="flex items-center space-x-2 flex-1">
            {hasChildren && (
              <button
                onClick={() => handleParticipantClick(participant)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <span className="font-medium">{participant.name}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditParticipant(participant)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteParticipant(participant.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAddChild(participant)}
              className="text-green-600 hover:text-green-800"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4 transition-all duration-200 ease-in-out">
            {participant.children?.map(child => renderParticipant(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse mb-4">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
        </div>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {parentChain.length > 0 && (
            <button
              onClick={handleGoBack}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          )}
          <h1 className="text-2xl font-bold">
            {selectedParticipant ? `Children of ${selectedParticipant.name}` : 'Root Participants'}
          </h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Participant
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {renderBreadcrumbs()}
          <div className="space-y-2">
            {participants.map(participant => renderParticipant(participant))}
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Add {selectedParticipant ? 'Child' : 'Root'} Participant
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ParticipantForm
              typeId="root"
              participant={selectedParticipant ? {
                id_Participant: selectedParticipant.id,
                name: selectedParticipant.name,
                attributeValues: {}
              } : undefined}
              attributes={[]}
              onSubmit={handleSubmitParticipant}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </div>
        </div>
      )}

      {editingParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Participant</h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editingParticipant.name}
                  onChange={(e) => setEditingParticipant({
                    ...editingParticipant,
                    name: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <ParticipantAttributeManager
                participantId={editingParticipant.id}
                onAttributesChange={(attributes) => {
                  setEditingParticipant({
                    ...editingParticipant,
                    attributes
                  });
                }}
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleParticipantUpdate(editingParticipant)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList; 