import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Users, Settings } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => `
    flex items-center px-4 py-2 text-sm font-medium rounded-md
    ${isActive(path)
      ? 'bg-gray-900 text-white'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }
  `;

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold">PLM System</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={navLinkClass('/')}>
                  <HomeIcon className="mr-3 h-5 w-5" />
                  Home
                </Link>
                <Link to="/participants" className={navLinkClass('/participants')}>
                  <Users className="mr-3 h-5 w-5" />
                  Participants
                </Link>
                <Link to="/participant-types" className={navLinkClass('/participant-types')}>
                  <Settings className="mr-3 h-5 w-5" />
                  Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 