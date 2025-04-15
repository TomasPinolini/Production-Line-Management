import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, UsersIcon, SettingsIcon } from '../utils/icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold">PLM System</Link>
            <div className="flex space-x-4">
              <Link to="/" className="flex items-center space-x-1 hover:text-blue-400">
                <HomeIcon size={20} />
                <span>Home</span>
              </Link>
              <Link to="/participants" className="flex items-center space-x-1 hover:text-blue-400">
                <UsersIcon size={20} />
                <span>Participants</span>
              </Link>
              <Link
                to="/assets"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Assets
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}; 