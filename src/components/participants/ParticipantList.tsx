import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ParticipantType, VariableAttribute, Participant } from '../../types';
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ParticipantForm from './ParticipantForm';

const API_BASE_URL = 'http://localhost:3000/api';

interface AttributeValue {
  id: number;
  value: string;
}

interface ParticipantWithAttributes extends Participant {
  attributeValues: { [key: string]: string };
}

export const ParticipantList: React.FC = () => {
  const { typeId } = useParams<{ typeId: string }>();
  const navigate = useNavigate();
  const [type, setType] = useState<ParticipantType | null>(null);
  const [attributes, setAttributes] = useState<VariableAttribute[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithAttributes[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (typeId) {
      Promise.all([
        fetchType(parseInt(typeId)),
        fetchAttributes(parseInt(typeId)),
        fetchParticipants()
      ]).catch(err => {
        console.error('Error loading data:', err);
        setError(true);
        toast.error('Failed to load data');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [typeId]);

  const fetchType = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/participant-types/${id}`);
    if (!response.ok) throw new Error('Failed to fetch participant type');
    const data = await response.json();
    setType({
      id: data.id,
      name: data.name,
      description: data.description,
      attributes: []
    });
  };

  const fetchAttributes = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/participant-types/${id}/attributes`);
    if (!response.ok) throw new Error('Failed to fetch attributes');
    const data = await response.json();
    setAttributes(data);
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/participants/type/${typeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Transform the data to match our interface
      const transformedData = data.map((participant: any) => ({
        ...participant,
        attributeValues: {}
      }));
      setParticipants(transformedData);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      toast.error('Failed to load participants');
      setError(true);
    }
  };

  const handleBack = () => {
    navigate('/participants');
  };

  const handleAddParticipant = () => {
    setIsAddModalOpen(true);
  };

  const handleSubmitParticipant = async (data: { name: string; attributes: AttributeValue[] }) => {
    if (!typeId) return;

    try {
      // Create the participant with attributes in a single request
      const response = await fetch(`${API_BASE_URL}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          type_id: parseInt(typeId),
          attributes: data.attributes
        }),
      });

      if (!response.ok) throw new Error('Failed to create participant');
      
      // Refresh the participants list
      await fetchParticipants();
      setIsAddModalOpen(false);
      toast.success('Participant added successfully');
    } catch (err) {
      console.error('Error adding participant:', err);
      toast.error('Failed to add participant');
    }
  };

  const handleEditParticipant = (participant: ParticipantWithAttributes) => {
    // Implement edit logic here
  };

  const handleDeleteParticipant = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete participant');
      
      // Refresh the participants list
      await fetchParticipants();
      toast.success('Participant deleted successfully');
    } catch (err) {
      console.error('Error deleting participant:', err);
      toast.error('Failed to delete participant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading participants...</div>
      </div>
    );
  }

  if (error || !type) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error ? 'Failed to load participant type' : 'Failed to load participant type'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex sm:items-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="ml-4 text-2xl font-bold text-gray-900">
            {type.name} Participants
          </h1>
        </div>
        <button
          onClick={handleAddParticipant}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Participant
        </button>
      </div>

      {/* Add Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add New Participant</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <ParticipantForm
                typeId={typeId || ''}
                attributes={attributes}
                onSubmit={handleSubmitParticipant}
                onCancel={() => setIsAddModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    {attributes.map((attr) => (
                      <th
                        key={attr.id}
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {attr.name}
                      </th>
                    ))}
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {participant.name}
                      </td>
                      {attributes.map((attr) => (
                        <td key={attr.id} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {participant.attributes?.find(a => a.id === attr.id)?.value || '-'}
                        </td>
                      ))}
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEditParticipant(participant)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(participant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {participants.length === 0 && (
                    <tr>
                      <td
                        colSpan={attributes.length + 2}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No participants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantList; 