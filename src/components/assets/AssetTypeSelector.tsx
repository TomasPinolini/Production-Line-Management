import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssetType, ApiResponse } from '../../types';
import { UsersIcon } from '../../utils/icons';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api';

export const AssetTypeSelector: React.FC = () => {
  const [types, setTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/asset-types`);
      if (!response.ok) throw new Error('Failed to fetch asset types');
      const data: ApiResponse<AssetType[]> = await response.json();
      
      if (!data.data) {
        throw new Error('No data received');
      }
      
      // Transform the data to ensure consistent ID handling
      const transformedData: AssetType[] = data.data.map((type: AssetType) => ({
        ...type,
        id: type.id || 0,
        attributes: type.attributes || []
      }));
      
      setTypes(transformedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load asset types';
      setError(message);
      console.error('Error fetching asset types:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (typeId: number) => {
    navigate(`/assets/${typeId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading asset types...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Select Asset Type
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose an asset type to view and manage its assets
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeSelect(type.id)}
            className="relative flex flex-col items-center p-6 bg-white rounded-lg shadow transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{type.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              View and manage {type.name.toLowerCase()} assets
            </p>
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
                <span className="text-sm font-medium text-blue-600">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssetTypeSelector; 