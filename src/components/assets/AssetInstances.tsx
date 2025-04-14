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
  hasChildren: boolean;
}

interface CategoryLevel {
  categoryId: number | null;
  options: CategoryOption[];
}

export const AssetInstances: React.FC = () => {
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([{ categoryId: null, options: [] }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    attributeValues: {} as Record<number, string>
  });

  // Get the currently selected category (last selected with no children or last in the chain)
  const selectedCategory = categoryLevels.length > 0 
    ? categoryLevels[categoryLevels.length - 1].options.find(
        cat => cat.id === categoryLevels[categoryLevels.length - 1].categoryId
      )
    : null;

  useEffect(() => {
    fetchRootCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchInstances(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchRootCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/categories/roots`);
      if (!response.ok) throw new Error('Failed to load root categories');
      const data = await response.json();
      setCategoryLevels([{ categoryId: null, options: data }]);
      setError(null);
    } catch (err) {
      console.error('Error fetching root categories:', err);
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildCategories = async (parentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/categories/${parentId}/children`);
      if (!response.ok) throw new Error('Failed to load child categories');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching child categories:', err);
      toast.error('Failed to load child categories');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (levelIndex: number, categoryId: number | null) => {
    try {
      // Update the selected category at this level
      const updatedLevels = [...categoryLevels.slice(0, levelIndex + 1)];
      updatedLevels[levelIndex] = {
        ...updatedLevels[levelIndex],
        categoryId
      };

      if (categoryId !== null) {
        const selectedCat = categoryLevels[levelIndex].options.find(cat => cat.id === categoryId);
        if (selectedCat?.hasChildren) {
          const childCategories = await fetchChildCategories(categoryId);
          updatedLevels.push({ categoryId: null, options: childCategories });
        }
      }

      setCategoryLevels(updatedLevels);
    } catch (err) {
      console.error('Error handling category change:', err);
      toast.error('Failed to load category data');
    }
  };

  const fetchInstances = async (categoryId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/instances/${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to load instances');
      }
      const data = await response.json();
      setInstances(data);
      setError(null);
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
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-500">
              Required format: {attribute.format_data}
            </p>
            <p className="text-xs text-gray-400">
              This is a validation pattern that ensures your input matches the required format.
              {attribute.format_data.includes('\\d') && ' Numbers are required.'}
              {attribute.format_data.includes('[A-Z]') && ' Uppercase letters are required.'}
              {attribute.format_data.includes('[a-z]') && ' Lowercase letters are required.'}
              {attribute.format_data.includes('[0-9A-Fa-f]') && ' Hexadecimal characters are required.'}
            </p>
          </div>
        )}
        {!isValid && value && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            The value does not match the required format pattern
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Select Category</h2>
        <div className="space-y-4">
          {categoryLevels.map((level, index) => (
            <div key={`level-${index}`} className="flex items-center space-x-2">
              <select
                value={level.categoryId || ''}
                onChange={(e) => handleCategoryChange(index, e.target.value ? Number(e.target.value) : null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select {index === 0 ? 'Category' : 'Subcategory'}</option>
                {level.options.map((category) => (
                  <option key={`cat-${category.id}-level-${index}`} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {index === categoryLevels.length - 1 && level.categoryId && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instance
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Instances of {selectedCategory.name}</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  {selectedCategory.attributes.map(attr => (
                    <th key={`header-${attr.id}`} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {attr.name}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instances.map(instance => (
                  <tr key={`instance-${instance.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{instance.name}</td>
                    {selectedCategory.attributes.map(attr => {
                      const attributeValue = instance.attributeValues.find(av => av.attribute_id === attr.id);
                      return (
                        <td key={`value-${instance.id}-${attr.id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attributeValue?.value || '-'}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

export default AssetInstances; 