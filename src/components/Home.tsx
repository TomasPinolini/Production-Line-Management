import React from 'react';
import { AssetList } from './assets/AssetList';

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Production Line Management System
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Track and manage all assets and resources in your production process efficiently.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Asset Management
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your production assets, their attributes, and hierarchical relationships.
        </p>
        <AssetList />
      </div>
    </div>
  );
};

export default Home; 