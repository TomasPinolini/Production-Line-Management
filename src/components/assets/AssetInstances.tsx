import React, { useState, useEffect } from 'react';
import { Asset, VariableAttribute } from '../../types';
import { Edit2, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api';

interface AssetInstance extends Asset {
  attributeValues: Array<{
    id: number;
    attribute_id: number;
    value: string;
  }>;
}

interface CategoryOption {
  id: number;
  name: string;
  attributes: VariableAttribute[];
}

export const AssetInstances: React.FC = () => {
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    attributeValues: {} as Record<number, string>
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchInstances(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    }
  };

  const fetchInstances = async (categoryId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/instances/${categoryId}`);
      const data = await response.json();
      setInstances(data);
    } catch (err) {
      setError('Failed to load instances');
      toast.error('Failed to load instances');
    } finally {
      setLoading(false);
    }
  };

  const validateAttributeValue = (value: string, format: string): boolean => {
    try {
      const regex = new RegExp(format);
      return regex.test(value);
    } catch (err) {
      console.error('Invalid regex pattern:', err);
      return false;
    }
  };

  const handleAttributeChange = (attributeId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [attributeId]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    // Validate all attributes
    const invalidAttributes = selectedCategory.attributes.filter(attr => {
      const value = formData.attributeValues[attr.id] || '';
      return attr.format_data && !validateAttributeValue(value, attr.format_data);
    });

    if (invalidAttributes.length > 0) {
      toast.error('Please fix the invalid attribute values');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/assets/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          id_parent: selectedCategory.id,
          attributeValues: Object.entries(formData.attributeValues).map(([id, value]) => ({
            attribute_id: parseInt(id),
            value
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to create instance');
      
      toast.success('Instance created successfully');
      setIsAddModalOpen(false);
      setFormData({ name: '', attributeValues: {} });
      fetchInstances(selectedCategory.id);
    } catch (err) {
      toast.error('Failed to create instance');
    }
  };

  const renderAttributeInput = (attribute: VariableAttribute) => {
    const value = formData.attributeValues[attribute.id] || '';
    const isValid = !attribute.format_data || validateAttributeValue(value, attribute.format_data);

    return (
      <div key={attribute.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {attribute.name}
          {attribute.description && (
            <span className="ml-1 text-sm text-gray-500">({attribute.description})</span>
          )}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            ${!isValid && value ? 'border-red-300' : ''}`}
        />
        {attribute.format_data && (
          <p className="mt-1 text-sm text-gray-500">
            Format: {attribute.format_data}
          </p>
        )}
        {!isValid && value && (
          <p className="mt-1 text-sm text-red-600">
            Value does not match the required format
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Select Category</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={selectedCategory?.id || ''}
          onChange={(e) => {
            const category = categories.find(c => c.id === parseInt(e.target.value));
            setSelectedCategory(category || null);
          }}
        >
          <option value="">Select a category...</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Instances of {selectedCategory.name}
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Instance
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {selectedCategory.attributes.map(attr => (
                    <th key={attr.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {attr.name}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instances.map(instance => (
                  <tr key={instance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {instance.name}
                    </td>
                    {selectedCategory.attributes.map(attr => (
                      <td key={attr.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {instance.attributeValues.find(v => v.attribute_id === attr.id)?.value || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {/* TODO: Implement edit */}}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement delete */}}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isAddModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New {selectedCategory.name} Instance
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              {selectedCategory.attributes.map(renderAttributeInput)}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-600"
                >
                  Create Instance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 