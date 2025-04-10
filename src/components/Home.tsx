import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Settings } from 'lucide-react';

const Home: React.FC = () => {
  console.log('Home component is rendering');

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Production Line Management
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Welcome to the Production Line Management System. Track and manage all participants and resources in your production process efficiently.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Link
              to="/participants"
              className="relative block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Production Participants</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage all participants in your production line, including tools, materials, and resources
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/participant-types"
              className="relative block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Participant Categories</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure and manage different types of production line participants and their attributes
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 