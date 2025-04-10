import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold">PLM System</Link>
            <div className="flex space-x-4">
              <Link to="/" className="flex items-center space-x-1 hover:text-blue-400">
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link to="/participants" className="flex items-center space-x-1 hover:text-blue-400">
                <Users size={20} />
                <span>Participants</span>
              </Link>
              <Link to="/categories" className="flex items-center space-x-1 hover:text-blue-400">
                <Settings size={20} />
                <span>Categories</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}; 