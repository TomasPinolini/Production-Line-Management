import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface InheritedAttribute {
  id: number;
  name: string;
  description: string | null;
  format_data: string | null;
  is_reference: boolean;
  is_shared: boolean;
  is_inherited: boolean;
  inherited_from: number | null;
  is_value_inherited: boolean;
  asset_name: string;
}

interface AssetAttributeInheritanceProps {
  assetId: number;
  onInheritanceChange?: () => void;
}

const AssetAttributeInheritance: React.FC<AssetAttributeInheritanceProps> = ({ assetId, onInheritanceChange }) => {
  const [inheritedAttributes, setInheritedAttributes] = useState<InheritedAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInheritedAttributes();
  }, [assetId]);

  const fetchInheritedAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/assets/${assetId}/inherited-attributes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inherited attributes');
      }

      const data = await response.json();
      setInheritedAttributes(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inherited attributes:', err);
      setError('Failed to load inherited attributes');
      toast.error('Failed to load inherited attributes');
    } finally {
      setLoading(false);
    }
  };

  const handleInheritAttribute = async (attributeId: number, inheritValue: boolean) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/assets/${assetId}/attributes/${attributeId}/inherit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inheritValue }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to set attribute inheritance');
      }

      toast.success('Attribute inheritance set successfully');
      if (onInheritanceChange) {
        onInheritanceChange();
      }
      fetchInheritedAttributes();
    } catch (err) {
      console.error('Error setting attribute inheritance:', err);
      toast.error('Failed to set attribute inheritance');
    }
  };

  if (loading) {
    return <div>Loading inherited attributes...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Inherited Attributes</h3>
      {inheritedAttributes.length === 0 ? (
        <p>No inherited attributes found.</p>
      ) : (
        <div className="space-y-2">
          {inheritedAttributes.map((attr) => (
            <div key={attr.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{attr.name}</h4>
                  <p className="text-sm text-gray-600">From: {attr.asset_name}</p>
                  {attr.description && (
                    <p className="text-sm text-gray-500">{attr.description}</p>
                  )}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleInheritAttribute(attr.id, true)}
                    className={`px-3 py-1 rounded ${
                      attr.is_value_inherited
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Inherit Value
                  </button>
                  <button
                    onClick={() => handleInheritAttribute(attr.id, false)}
                    className={`px-3 py-1 rounded ${
                      !attr.is_value_inherited
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Inherit Definition
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetAttributeInheritance; 