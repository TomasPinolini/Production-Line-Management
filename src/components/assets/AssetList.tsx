import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset, VariableAttribute } from '../../types';
import { ArrowLeft, Plus, EditIcon, DeleteIcon, CloseIcon, ChevronRight, ChevronDown } from '../../utils/icons';
import toast from 'react-hot-toast';
import AssetForm from './AssetForm';
import AssetAttributeManager from './AssetAttributeManager';

const API_BASE_URL = 'http://localhost:3000/api';

interface Breadcrumb {
  id: number;
  name: string;
}

export const AssetList: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [parentChain, setParentChain] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAttributeManagerOpen, setIsAttributeManagerOpen] = useState(false);

  useEffect(() => {
    if (selectedAsset) {
      fetchChildren(selectedAsset.id);
    } else {
      fetchRootAssets();
    }
  }, [selectedAsset]);

  const fetchRootAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/roots`);
      if (!response.ok) throw new Error('Failed to fetch root assets');
      const rootData = await response.json();
      
      setAssets(rootData);
      // Expand root assets by default
      const newExpanded = new Set(expandedAssets);
      rootData.forEach((p: Asset) => {
        if (p.children && p.children.length > 0) {
          newExpanded.add(p.id);
        }
      });
      setExpandedAssets(newExpanded);
      setLoading(false);
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to load assets');
      toast.error('Failed to load assets');
      setLoading(false);
    }
  };

  const fetchChildren = async (parentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/${parentId}`);
      if (!response.ok) throw new Error('Failed to fetch asset');
      const asset = await response.json();
      setAssets(asset.children || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading children:', err);
      setError('Failed to load children');
      toast.error('Failed to load children');
      setLoading(false);
    }
  };

  const handleAssetSelect = async (asset: Asset) => {
    setSelectedAsset(asset);
    setParentChain(prev => [...prev, asset]);
  };

  const handleGoBack = () => {
    if (parentChain.length > 0) {
      const newParentChain = parentChain.slice(0, -1);
      const newSelectedAsset = newParentChain[newParentChain.length - 1] || null;
      setParentChain(newParentChain);
      setSelectedAsset(newSelectedAsset);
    }
  };

  const handleSubmitAsset = async (data: { 
    name: string;
    type: string; 
    attributes: { 
      id: number; 
      value: string; 
    }[]; 
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          id_parent: selectedAsset?.id || null,
          attributes: data.attributes
        }),
      });

      if (!response.ok) throw new Error('Failed to create asset');
      
      // Refresh the current level
      if (selectedAsset) {
        fetchChildren(selectedAsset.id);
      } else {
        fetchRootAssets();
      }
      
      setIsAddModalOpen(false);
      toast.success('Asset added successfully');
    } catch (err) {
      console.error('Error adding asset:', err);
      toast.error('Failed to add asset');
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAttributeManagerOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingAsset(null);
    setIsAttributeManagerOpen(false);
  };

  const handleAssetUpdate = async (updatedAsset: Asset) => {
    try {
      setLoading(true);
      
      const updatePayload = {
        name: updatedAsset.name,
        id_parent: updatedAsset.id_parent,
        attributes: updatedAsset.attributes?.map(attr => ({
          name: attr.name,
          description: attr.description || '',
          format_data: attr.format_data || '',
          value: attr.value || ''
        })) || []
      };

      const response = await fetch(`${API_BASE_URL}/assets/${updatedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update asset');
      }
      
      const data = await response.json();

      // Update the local state
      setAssets(assets.map(p => p.id === data.id ? data : p));
      setEditingAsset(null);
      toast.success('Asset updated successfully');

      // Refresh the current view to get updated inheritance
      if (selectedAsset) {
        fetchChildren(selectedAsset.id);
      } else {
        fetchRootAssets();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update asset';
      setError(message);
      console.error('Error updating asset:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete asset');
      
      // Refresh the assets list
      fetchRootAssets();
      toast.success('Asset deleted successfully');
    } catch (err) {
      console.error('Error deleting asset:', err);
      toast.error('Failed to delete asset');
    }
  };

  const handleAssetClick = (asset: Asset) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(asset.id)) {
      newExpanded.delete(asset.id);
    } else {
      newExpanded.add(asset.id);
    }
    setExpandedAssets(newExpanded);
  };

  const handleBreadcrumbClick = (assetId: number) => {
    const index = breadcrumbs.findIndex(b => b.id === assetId);
    if (index !== -1) {
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      const newExpanded = new Set(expandedAssets);
      setExpandedAssets(newExpanded);
    }
  };

  const handleAddChild = async (parent: Asset) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `New Child of ${parent.name}`,
          id_parent: parent.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to create child asset');
      const newChild = await response.json();

      // Expand the parent to show the new child
      setExpandedAssets(prev => new Set([...prev, parent.id]));

      // Refresh the current view to show the new child
      if (selectedAsset) {
        fetchChildren(selectedAsset.id);
      } else {
        fetchRootAssets();
      }

      setLoading(false);
      toast.success('Child asset added successfully');
    } catch (err) {
      console.error('Error adding child asset:', err);
      toast.error('Failed to add child asset');
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

  const renderAsset = (asset: Asset, level: number = 0) => {
    const isExpanded = expandedAssets.has(asset.id);
    const hasChildren = asset.children && asset.children.length > 0;

    return (
      <div 
        key={asset.id} 
        className={`transition-all duration-200 ease-in-out ${level > 0 ? 'ml-6' : ''}`}
      >
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <button
                onClick={() => handleAssetClick(asset)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <span className="font-medium">{asset.name}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditAsset(asset)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit asset"
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteAsset(asset.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete asset"
            >
              <DeleteIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAddChild(asset)}
              className="text-green-600 hover:text-green-800"
              title="Add child asset"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4 mt-2 space-y-2">
            {asset.children?.map(child => renderAsset(child, level + 1))}
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
            {selectedAsset ? `Children of ${selectedAsset.name}` : 'Root Assets'}
          </h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Asset
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {renderBreadcrumbs()}
          <div className="space-y-2">
            {assets.map(asset => renderAsset(asset))}
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Asset</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon size={24} />
              </button>
            </div>
            <AssetForm
              onSubmit={handleSubmitAsset}
              onCancel={() => setIsAddModalOpen(false)}
              attributes={[]}
            />
          </div>
        </div>
      )}

      {isAttributeManagerOpen && editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Attributes - {editingAsset.name}</h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon size={24} />
              </button>
            </div>
            <AssetAttributeManager
              assetId={editingAsset.id}
              onAttributesChange={() => {
                // Refresh the assets list when attributes change
                if (selectedAsset) {
                  fetchChildren(selectedAsset.id);
                } else {
                  fetchRootAssets();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 