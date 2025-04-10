import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ParticipantType, VariableAttribute, Participant } from '../../types';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api';

interface ParticipantWithAttributes extends Participant {
  attributeValues: Record<string, string>;
}

export const ParticipantList: React.FC = () => {
  const { typeId } = useParams<{ typeId: string }>();
  const navigate = useNavigate();
  const [type, setType] = useState<ParticipantType | null>(null);
  const [attributes, setAttributes] = useState<VariableAttribute[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeId) {
      Promise.all([
        fetchType(parseInt(typeId)),
        fetchAttributes(parseInt(typeId)),
        fetchParticipants(parseInt(typeId))
      ]).catch(err => {
        console.error('Error loading data:', err);
        setError('Failed to load data');
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
      id_PT: data.id,
      name: data.name,
      attributes: []
    });
  };

  const fetchAttributes = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/participant-types/${id}/attributes`);
    if (!response.ok) throw new Error('Failed to fetch attributes');
    const data = await response.json();
    const transformedAttributes = data.map((attr: any) => ({
      id_VA: attr.id,
      name: attr.name,
      id_Type: attr.participant_type_id,
      formatData: attr.formatData
    }));
    setAttributes(transformedAttributes);
  };

  const fetchParticipants = async (typeId: number) => {
    const response = await fetch(`${API_BASE_URL}/participants?typeId=${typeId}`);
    if (!response.ok) throw new Error('Failed to fetch participants');
    const data = await response.json();
    
    // Fetch attribute values for each participant
    const participantsWithAttributes = await Promise.all(
      data.map(async (participant: any) => {
        const valuesResponse = await fetch(`${API_BASE_URL}/participants/${participant.id_Participant}/attributes`);
        if (!valuesResponse.ok) throw new Error('Failed to fetch participant attributes');
        const values = await valuesResponse.json();
        
        const attributeValues: Record<string, string> = {};
        values.forEach((value: any) => {
          attributeValues[value.id_Attribute] = value.value;
        });

        return {
          id_Participant: participant.id_Participant,
          name: participant.name,
          id_Type: participant.id_Type,
          attributeValues
        };
      })
    );

    setParticipants(participantsWithAttributes);
  };

  const handleBack = () => {
    navigate('/participants');
  };

  const handleAddParticipant = () => {
    // TODO: Implement add participant functionality
    toast.error('Add participant functionality not implemented yet');
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
        {error || 'Failed to load participant type'}
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
                        key={attr.id_VA}
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
                    <tr key={participant.id_Participant}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {participant.name}
                      </td>
                      {attributes.map((attr) => (
                        <td key={attr.id_VA} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {participant.attributeValues[attr.id_VA] || '-'}
                        </td>
                      ))}
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={() => {/* TODO: Implement edit */}}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {/* TODO: Implement delete */}}
                        >
                          <Trash2 className="w-4 h-4" />
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