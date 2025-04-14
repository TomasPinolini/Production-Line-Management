import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Participant, VariableAttribute } from '../types';

interface ParticipantTableProps {
  participants: Participant[];
  attributes: VariableAttribute[];
  onEdit?: (participant: Participant) => void;
  onDelete?: (participant: Participant) => void;
}

export function ParticipantTable({ 
  participants, 
  attributes,
  onEdit,
  onDelete 
}: ParticipantTableProps) {
  if (!participants.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        No entries found
      </div>
    );
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
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
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Created At
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participants.map((participant) => (
                <tr key={participant.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {participant.name}
                  </td>
                  {attributes.map((attr) => (
                    <td key={attr.id} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {participant.attributes?.find(a => a.id === attr.id)?.value || '-'}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {participant.created_at ? new Date(participant.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(participant)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(participant)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}