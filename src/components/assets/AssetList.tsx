import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset, VariableAttribute } from '../../types';
import { Plus, Edit2, Trash2, HomeIcon, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AssetForm from './AssetForm';
import AssetAttributeManager from './AssetAttributeManager';

const API_BASE_URL = 'http://localhost:3000/api';

interface AssetNode extends Asset {
  children?: AssetNode[];
  isExpanded?: boolean;
}

export const AssetList: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<AssetNode[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAttributeManagerOpen, setIsAttributeManagerOpen] = useState(false);

  useEffect(() => {
    fetchAssetHierarchy();
  }, []);

  const fetchAssetHierarchy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/hierarchy`);
      const data = await response.json();
      
      if (!response.ok) throw new Error('Failed to fetch asset hierarchy');
      
      setAssets(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching asset hierarchy:', err);
      setError('Failed to load assets');
      toast.error('Failed to load assets');
      setLoading(false);
    }
  };

  const toggleExpand = (asset: AssetNode) => {
    setAssets(prevAssets => {
      const updateAssetInTree = (assets: AssetNode[]): AssetNode[] => {
        return assets.map(a => {
          if (a.id === asset.id) {
            return { ...a, isExpanded: !a.isExpanded };
          }
          if (a.children) {
            return { ...a, children: updateAssetInTree(a.children) };
          }
          return a;
        });
      };
      return updateAssetInTree(prevAssets);
    });
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAttributeManagerOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingAsset(null);
    setIsAttributeManagerOpen(false);
  };

  const handleDeleteAsset = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      toast.success('Asset deleted successfully');
      fetchAssetHierarchy();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleAddChild = (parent: Asset) => {
    setSelectedAsset(parent);
    setIsAddModalOpen(true);
  };

  const checkForCircularReference = async (parentId: number, childId: number): Promise<boolean> => {
    try {
      // Get all ancestors of the potential parent
      const response = await fetch(`${API_BASE_URL}/assets/${parentId}/ancestors`);
      if (!response.ok) throw new Error('Failed to check ancestors');
      const ancestors = await response.json();
      
      // If the child is in the ancestors list, it would create a circular reference
      return ancestors.some((ancestor: Asset) => ancestor.id === childId);
    } catch (error) {
      console.error('Error checking for circular reference:', error);
      return false;
    }
  };

  const handleSubmitAsset = async (assetData: {
    name: string;
    id_parent?: number;
    attributes: { id: number; value: string; }[];
  }) => {
    try {
      // If we're editing an existing asset and changing its parent, check for circular reference
      if (editingAsset && selectedAsset && editingAsset.id !== selectedAsset.id) {
        const wouldCreateCircular = await checkForCircularReference(selectedAsset.id, editingAsset.id);
        if (wouldCreateCircular) {
          toast.error('Cannot create circular reference in asset hierarchy');
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: assetData.name,
          id_parent: selectedAsset?.id || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create asset');
      }

      const newAsset = await response.json();

      // Update attribute values if any
      if (assetData.attributes.length > 0) {
        const attributePromises = assetData.attributes.map(attr => 
          fetch(`${API_BASE_URL}/assets/${newAsset.id}/attributes/${attr.id}/value`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: attr.value }),
          })
        );

        await Promise.all(attributePromises);
      }

      toast.success('Asset created successfully');
      setIsAddModalOpen(false);
      setSelectedAsset(null);
      fetchAssetHierarchy();
    } catch (error) {
      console.error('Error creating asset:', error);
      toast.error('Failed to create asset');
    }
  };

  const renderAssetNode = (asset: AssetNode, level: number = 0) => {
    const isSelected = selectedAsset?.id === asset.id;
    const hasChildren = asset.children && asset.children.length > 0;
    
    return (
      <div key={asset.id} className="w-full">
        <div 
          className={`
            flex items-center justify-between p-3 border-b border-dark-600
            ${isSelected ? 'bg-dark-600' : 'hover:bg-dark-700'}
            transition-colors duration-150 ease-in-out
          `}
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
        >
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(asset)}
                className="p-1 text-dark-200 hover:text-dark-50"
              >
                {asset.isExpanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-[26px]" />}
            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-dark-300'}`} />
            <span className={`${isSelected ? 'text-blue-300 font-medium' : 'text-dark-100'}`}>
              {asset.name}
            </span>
            {isSelected && (
              <div className="flex items-center text-blue-400">
                <ArrowRight size={16} className="ml-2" />
                <span className="ml-1 text-sm">Adding child asset</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEditAsset(asset)}
              className="p-1 text-dark-200 hover:text-blue-300"
              title="Edit asset"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => handleDeleteAsset(asset.id)}
              className="p-1 text-dark-200 hover:text-red-300"
              title="Delete asset"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => handleAddChild(asset)}
              className={`p-1 ${
                isSelected 
                  ? 'text-green-300 hover:text-green-200' 
                  : 'text-dark-200 hover:text-green-300'
              }`}
              title="Add child asset"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        {hasChildren && asset.isExpanded && (
          <div className="w-full">
            {asset.children!.map(child => renderAssetNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-dark-50 mb-2">Asset Management</h1>
        <p className="text-dark-200">
          Manage your production assets, their attributes, and hierarchical relationships.
        </p>
      </div>

      <div className="bg-dark-700 rounded-lg shadow-xl border border-dark-600">
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div className="flex items-center space-x-2">
            <HomeIcon size={20} className="text-dark-200" />
            <h2 className="text-lg font-medium text-dark-100">Assets</h2>
          </div>
          <button
            onClick={() => {
              setSelectedAsset(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-500 text-dark-50 rounded-md hover:bg-blue-600 
                     transition-colors duration-150 ease-in-out flex items-center"
          >
            <Plus size={16} className="mr-1" /> Add Root Asset
          </button>
        </div>

        <div>
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-dark-600 rounded" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-300">{error}</div>
          ) : assets.length === 0 ? (
            <div className="p-8 text-center text-dark-200">
              No assets found. Click "Add Root Asset" to create one.
            </div>
          ) : (
            assets.map(asset => renderAssetNode(asset))
          )}
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AssetForm
          attributes={[]}
          parentId={selectedAsset?.id}
          onSubmit={handleSubmitAsset}
          onCancel={() => {
            setIsAddModalOpen(false);
            setSelectedAsset(null);
          }}
        />
      )}
      {isAttributeManagerOpen && editingAsset && (
        <AssetAttributeManager
          assetId={editingAsset.id}
          onAttributesChange={() => {
            handleCloseEdit();
            fetchAssetHierarchy();
          }}
        />
      )}
    </div>
  );
}; 